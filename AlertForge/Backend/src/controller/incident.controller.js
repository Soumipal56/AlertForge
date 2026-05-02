import { 
    createIncidentService, 
    getAllIncidentsService, 
    getIncidentByIdService, 
    updateIncidentStatusService, 
    updateIncidentSeverityService 
} from "../services/incident.service.js";
import { 
    getTimelineEventsByIncidentService,
    createTimelineEventService
} from "../services/timeline/timeline.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { incidentSchema } from "../validators/incident.validator.js";
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, INCIDENT_STATUS, SEVERITY } from "../config/constants.js";
import { TIMELINE_EVENTS } from "../utils/timeline.constants.js";
import { sendIncidentNotifications } from "../services/notification/notification.service.js";
import { emitIncidentUpdate, emitNewIncident, emitTimelineEvent } from "../services/socket/socket.service.js";
import { generatePostmortem } from "../services/postmortem.service.js";

const buildIncidentSocketPayload = (incident) => ({
    id: incident?._id?.toString?.() || incident?.id || null,
    title: incident?.title || incident?.message,
    severity: incident?.severity,
    status: incident?.status,
    createdAt: incident?.createdAt,
    updatedAt: incident?.updatedAt,
});

const saveTimelineEntry = async (type, incident, message = "", metadata = {}, user = null) => {
    // Save timeline event after incident changes so the activity feed survives refreshes.
    try {
        await createTimelineEventService({
            type,
            incidentId: incident?._id?.toString?.() || incident?.id,
            apiKeyId: incident.apiKeyId,
            message,
            metadata,
            createdBy: user?._id || user?.id || null,
            authorName: user?.name || "System",
            isPublic: true,
        });
    } catch (error) {
        console.error("[Timeline] Failed to persist timeline entry:", error.message);
    }
};

/**
 * @description Controller function to retrieve the timeline of an incident
 */
export const getIncidentTimeline = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page, limit } = req.query;

        const timeline = await getTimelineEventsByIncidentService(
            id, 
            req.apiKey._id, 
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20
        );

        return res.json(new ApiResponse(200, "Timeline fetched", timeline));
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller function to add a manual note/event to the timeline
 */
export const addTimelineNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { message, metadata, isPublic } = req.body;

        if (!message) {
            throw new ApiError(400, "Message is required for timeline note");
        }

        const timelineEvent = await createTimelineEventService({
            type: TIMELINE_EVENTS.NOTE_ADDED,
            incidentId: id,
            apiKeyId: req.apiKey._id,
            message,
            metadata: metadata || {},
            createdBy: req.user?.userId || null,
            authorName: req.user?.name || "Responder",
            isPublic: isPublic !== undefined ? isPublic : true,
        });

        const incident = await getIncidentByIdService(id, req.apiKey._id);

        emitTimelineEvent({
            type: TIMELINE_EVENTS.NOTE_ADDED,
            incident: buildIncidentSocketPayload(incident),
            event: timelineEvent
        });

        return res.status(201).json(new ApiResponse(201, "Note added to timeline", timelineEvent));
    } catch (error) {
        next(error);
    }
};



/**  
 * @description Controller function to create a new incident
 */
export const createIncident = async (req, res, next) => {
    try {
        const data = req.body;
        const validation = incidentSchema.safeParse(data);
        if (!validation.success) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, validation.error.errors[0].message);
        }

        const incident = await createIncidentService({
            ...data,
            apiKeyId: req.apiKey._id,
        }, req.user?.userId);
        
        await saveTimelineEntry(
            TIMELINE_EVENTS.INCIDENT_CREATED, 
            incident, 
            `Incident created: ${incident.title}`, 
            {}, 
            req.user
        );

        // Multi-channel notification fan-out
        const user = req.apiKey.user;
        if (user) {
            sendIncidentNotifications(user, incident);
        }

        emitNewIncident(incident);
        emitTimelineEvent({
            type: TIMELINE_EVENTS.INCIDENT_CREATED,
            incident: buildIncidentSocketPayload(incident),
        });

        return res
            .status(HTTP_STATUS.CREATED)
            .json(new ApiResponse(
                HTTP_STATUS.CREATED,
                SUCCESS_MESSAGES.INCIDENT.CREATED,
                incident
            ));

    } catch (error) {
        next(error);
    }
};

/**  
 * @description Controller function to retrieve all incidents for the dashboard
 */
export const getAllIncidents = async (req, res, next) => {
    try {
        const { status } = req.query;
        const normalizedStatus = typeof status === "string" ? status.trim().toLowerCase() : "all";

        const validStatuses = ["all", ...Object.values(INCIDENT_STATUS)];
        if (!validStatuses.includes(normalizedStatus)) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid status filter");
        }

        const { incidents, counts } = await getAllIncidentsService(req.apiKey._id, normalizedStatus);

        return res.json(new ApiResponse(
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.INCIDENT.FETCHED,
            { incidents, counts }
        ));

    } catch (error) {
        next(error);
    }
};

/**  
 * @description Controller function to retrieve a single incident by its ID
 */
export const getIncidentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const incident = await getIncidentByIdService(id, req.apiKey._id);

        if (!incident) {
            throw new ApiError(404, "Incident not found");
        }

        return res.json(new ApiResponse(200, "Incident fetched", incident));
    } catch (error) {
        next(error);
    }
};

/**  
 * @description Controller function to update the status of an incident
 */
export const updateIncidentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const normalizedStatus = typeof status === "string" ? status.trim().toLowerCase() : "";

        // 1. Fetch current state for metadata
        const currentIncident = await getIncidentByIdService(id, req.apiKey._id);
        if (!currentIncident) {
            throw new ApiError(404, "Incident not found");
        }

        const oldStatus = currentIncident.status;

        // 2. Perform update via service (lifecycle validation happens here)
        const updated = await updateIncidentStatusService(id, req.apiKey._id, normalizedStatus);

        // 3. Log to timeline
        await saveTimelineEntry(
            TIMELINE_EVENTS.STATUS_CHANGED, 
            updated, 
            `Status changed from ${oldStatus} to ${updated.status}`, 
            { from: oldStatus, to: updated.status },
            req.user
        );

        emitIncidentUpdate(updated);
        emitTimelineEvent({
            type: TIMELINE_EVENTS.STATUS_CHANGED,
            incident: buildIncidentSocketPayload(updated),
            metadata: { from: oldStatus, to: updated.status }
        });

        // Trigger resolution logic if needed
        if (normalizedStatus === INCIDENT_STATUS.RESOLVED) {
            try {
                await generatePostmortem(updated?._id?.toString?.() || id, req.apiKey._id);
            } catch (error) {
                console.error("[Postmortem] Generation failed:", error.message);
            }
        }

        return res.json(new ApiResponse(200, "Incident status updated", updated));
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller function to update the severity of an incident
 */
export const updateIncidentSeverity = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { severity } = req.body;
        const normalizedSeverity = typeof severity === "string" ? severity.trim().toUpperCase() : "";

        const currentIncident = await getIncidentByIdService(id, req.apiKey._id);
        if (!currentIncident) {
            throw new ApiError(404, "Incident not found");
        }

        const oldSeverity = currentIncident.severity;

        const updated = await updateIncidentSeverityService(id, req.apiKey._id, normalizedSeverity);

        await saveTimelineEntry(
            TIMELINE_EVENTS.SEVERITY_CHANGED, 
            updated, 
            `Severity changed from ${oldSeverity} to ${updated.severity}`, 
            { from: oldSeverity, to: updated.severity },
            req.user
        );

        emitIncidentUpdate(updated);
        emitTimelineEvent({
            type: TIMELINE_EVENTS.SEVERITY_CHANGED,
            incident: buildIncidentSocketPayload(updated),
            metadata: { from: oldSeverity, to: updated.severity }
        });

        return res.json(new ApiResponse(200, "Incident severity updated", updated));
    } catch (error) {
        next(error);
    }
};


