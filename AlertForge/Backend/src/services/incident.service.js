import { createIncidentDAO, getAllIncidentsDAO, getIncidentByIdDAO, updateIncidentStatusDAO, getIncidentCountsDAO, updateIncidentSeverityDAO } from "../dao/incident.dao.js";
import { fetchTavilyInsights } from "./ai/tavily.service.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, INCIDENT_STATUS, SEVERITY } from "../config/constants.js";

/**  
 * @description Service function to retrieve all incidents from the database with status filtering and counts
 * @returns {Object} { incidents: Array, counts: Object }
 */
export const getAllIncidentsService = async (apiKeyId, status = "all") => {
    if (!apiKeyId) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    }

    // 1. Fetch filtered incidents
    const incidents = await getAllIncidentsDAO(apiKeyId, status);

    // 2. Fetch aggregation counts
    const aggregation = await getIncidentCountsDAO(apiKeyId);

    // 3. Transform aggregation into a clean counts object with defaults
    const counts = {
        all: 0,
        active: 0,
        investigating: 0,
        identified: 0,
        monitoring: 0,
        resolved: 0,
    };

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

/**  
 * @description Service function to retrieve a single incident by its ID from the database
 * @param {string} id - The ID of the incident to retrieve
 * @returns {Object} The incident document from the database, or null if not found
 */
export const getIncidentByIdService = async (id, apiKeyId) => {
    if (!apiKeyId) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    }

    return await getIncidentByIdDAO(id, apiKeyId);
};

/**  
 * @description Service function to create a new incident
 * @param {Object} data - Incident data
 * @param {string} creatorId - ID of the user creating the incident
 * @returns {Object} The created incident document
 */
export const createIncidentService = async (data, creatorId) => {
    // 1. Fetch real-world insights asynchronously
    const { summary } = await fetchTavilyInsights(data.title || data.message, data.service, data.severity);
    if (summary) {
        data.realWorldInsights = summary;
    }

    // 2. Set defaults
    data.startedAt = new Date();
    data.responders = creatorId ? [creatorId] : [];
    data.status = data.status || INCIDENT_STATUS.INVESTIGATING;
    data.severity = data.severity || SEVERITY.P3;

    return await createIncidentDAO(data);
};

/**  
 * @description Service function to update the status of an incident with lifecycle validation
 * Flow: investigating -> identified -> monitoring -> resolved
 */
export const updateIncidentStatusService = async (id, apiKeyId, status) => {
    if (!apiKeyId) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    }

    const incident = await getIncidentByIdDAO(id, apiKeyId);
    if (!incident) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Incident not found");
    }

    const currentStatus = incident.status;
    const nextStatus = status;

    // 1. Prevent updates to already resolved incidents
    if (currentStatus === INCIDENT_STATUS.RESOLVED) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Resolved incidents cannot be updated");
    }

    // 2. Define allowed transitions
    const flow = [
        INCIDENT_STATUS.ACTIVE, // Allow active as a starting point if it exists
        INCIDENT_STATUS.INVESTIGATING,
        INCIDENT_STATUS.IDENTIFIED,
        INCIDENT_STATUS.MONITORING,
        INCIDENT_STATUS.RESOLVED
    ];

    const currentIndex = flow.indexOf(currentStatus);
    const nextIndex = flow.indexOf(nextStatus);

    // 3. Enforce only forward transitions to the immediate next state
    // Note: User said "Cannot jump randomly" and "Only forward transitions allowed"
    if (nextIndex <= currentIndex) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid status transition: cannot move from ${currentStatus} back to ${nextStatus}`);
    }

    // Optional: If you want to enforce EXACT NEXT state:
    // if (nextIndex !== currentIndex + 1) { throw new ApiError(...) }

    const extraUpdates = {};
    if (nextStatus === INCIDENT_STATUS.RESOLVED) {
        extraUpdates.resolvedAt = new Date();
    }

    return await updateIncidentStatusDAO(id, apiKeyId, nextStatus, extraUpdates);
};

/**
 * @description Service function to update the severity of an incident
 */
export const updateIncidentSeverityService = async (id, apiKeyId, severity) => {
    if (!apiKeyId) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    }

    if (!Object.values(SEVERITY).includes(severity)) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid severity level");
    }

    return await updateIncidentSeverityDAO(id, apiKeyId, severity);
};

