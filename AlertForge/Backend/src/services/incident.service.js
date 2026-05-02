import { createIncidentDAO, getAllIncidentsDAO, getIncidentByIdDAO, updateIncidentStatusDAO, getIncidentCountsDAO, updateIncidentSeverityDAO } from "../dao/incident.dao.js";
import { fetchTavilyInsights } from "./ai/tavily.service.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, INCIDENT_STATUS, SEVERITY } from "../config/constants.js";
import { autoLogTimelineEvent } from "./timeline/timeline.service.js";
import { TIMELINE_EVENTS } from "../utils/timeline.constants.js";
import { emitIncidentUpdate, emitNewIncident, emitTimelineEvent } from "./socket/socket.service.js";
import { generatePostmortem } from "./postmortem.service.js";
import { sendIncidentNotifications } from "./notification/notification.service.js";

/**  
 * @description Service function to retrieve all incidents from the database with status filtering and counts
 */
export const getAllIncidentsService = async (apiKeyId, status = "all") => {
    if (!apiKeyId) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    }
    const incidents = await getAllIncidentsDAO(apiKeyId, status);
    const aggregation = await getIncidentCountsDAO(apiKeyId);

    const counts = { all: 0, active: 0, investigating: 0, identified: 0, monitoring: 0, resolved: 0 };
    const validStatuses = Object.keys(counts).filter(k => k !== "all");

    let total = 0;
    aggregation.forEach(item => {
        if (validStatuses.includes(item._id)) {
            counts[item._id] = item.count;
            total += item.count;
        }
    });
    counts.all = total;

    return { incidents, counts };
};

export const getIncidentByIdService = async (id, apiKeyId) => {
    if (!apiKeyId) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    }
    return await getIncidentByIdDAO(id, apiKeyId);
};

/**  
 * @description Service function to create a new incident with full orchestration
 */
export const createIncidentService = async (data, user, apiKey) => {
    // 1. Fetch AI insights
    const { summary } = await fetchTavilyInsights(data.title || data.message, data.service, data.severity);
    if (summary) data.realWorldInsights = summary;

    // 2. Set defaults
    data.startedAt = new Date();
    data.responders = user?.userId ? [user.userId] : [];
    data.status = data.status || INCIDENT_STATUS.INVESTIGATING;
    data.severity = data.severity || SEVERITY.P3;
    data.apiKeyId = apiKey._id;

    // 3. Persist to DB
    const incident = await createIncidentDAO(data);

    // 4. SIDE EFFECTS (ORCHESTRATION)
    // a. Timeline Log
    await autoLogTimelineEvent({
        incidentId: incident._id,
        apiKeyId: apiKey._id,
        type: TIMELINE_EVENTS.INCIDENT_CREATED,
        message: `Incident created: ${incident.title}`,
        user
    });

    // b. Notifications
    if (apiKey.user) {
        sendIncidentNotifications(apiKey.user, incident).catch(console.error);
    }

    // c. Sockets
    emitNewIncident(incident);
    emitTimelineEvent({
        type: TIMELINE_EVENTS.INCIDENT_CREATED,
        incident: { id: incident._id, title: incident.title, status: incident.status, severity: incident.severity }
    });

    return incident;
};

/**  
 * @description Service function to update the status of an incident with full orchestration
 */
export const updateIncidentStatusService = async (id, apiKeyId, status, user) => {
    if (!apiKeyId) throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authentication required");

    const incident = await getIncidentByIdDAO(id, apiKeyId);
    if (!incident) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Incident not found");

    const currentStatus = incident.status;
    if (currentStatus === INCIDENT_STATUS.RESOLVED) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Resolved incidents cannot be updated");
    }

    // Lifecycle validation
    const flow = [INCIDENT_STATUS.ACTIVE, INCIDENT_STATUS.INVESTIGATING, INCIDENT_STATUS.IDENTIFIED, INCIDENT_STATUS.MONITORING, INCIDENT_STATUS.RESOLVED];
    const currentIndex = flow.indexOf(currentStatus);
    const nextIndex = flow.indexOf(status);

    if (nextIndex <= currentIndex) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid status transition: cannot move back to ${status}`);
    }

    const extraUpdates = {};
    if (status === INCIDENT_STATUS.RESOLVED) extraUpdates.resolvedAt = new Date();

    const updated = await updateIncidentStatusDAO(id, apiKeyId, status, extraUpdates);

    // SIDE EFFECTS
    await autoLogTimelineEvent({
        incidentId: id,
        apiKeyId,
        type: TIMELINE_EVENTS.STATUS_CHANGED,
        message: `Status changed from ${currentStatus} to ${status}`,
        metadata: { from: currentStatus, to: status },
        user
    });

    emitIncidentUpdate(updated);
    emitTimelineEvent({
        type: TIMELINE_EVENTS.STATUS_CHANGED,
        incident: { id: updated._id, title: updated.title, status: updated.status, severity: updated.severity },
        metadata: { from: currentStatus, to: status }
    });

    if (status === INCIDENT_STATUS.RESOLVED) {
        generatePostmortem(id, apiKeyId).catch(console.error);
    }

    return updated;
};

/**
 * @description Service function to update severity with full orchestration
 */
export const updateIncidentSeverityService = async (id, apiKeyId, severity, user) => {
    if (!apiKeyId) throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    if (!Object.values(SEVERITY).includes(severity)) throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid severity");

    const incident = await getIncidentByIdDAO(id, apiKeyId);
    if (!incident) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Incident not found");

    const oldSeverity = incident.severity;
    const updated = await updateIncidentSeverityDAO(id, apiKeyId, severity);

    // SIDE EFFECTS
    await autoLogTimelineEvent({
        incidentId: id,
        apiKeyId,
        type: TIMELINE_EVENTS.SEVERITY_CHANGED,
        message: `Severity changed from ${oldSeverity} to ${severity}`,
        metadata: { from: oldSeverity, to: severity },
        user
    });

    emitIncidentUpdate(updated);
    emitTimelineEvent({
        type: TIMELINE_EVENTS.SEVERITY_CHANGED,
        incident: { id: updated._id, title: updated.title, status: updated.status, severity: updated.severity },
        metadata: { from: oldSeverity, to: severity }
    });

    return updated;
};


