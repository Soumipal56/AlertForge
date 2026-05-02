import { createTimelineEventDAO, getTimelineEventsByIncidentDAO } from "../../dao/timelineEvent.dao.js";
import { getIncidentByIdDAO } from "../../dao/incident.dao.js";
import { TIMELINE_EVENTS } from "../../utils/timeline.constants.js";
import ApiError from "../../utils/ApiError.js";
import { HTTP_STATUS } from "../../config/constants.js";

/**
 * Saves a durable timeline entry after an incident lifecycle change.
 * @param {Object} data - { type, incidentId, apiKeyId, message, metadata, createdBy, authorName, isPublic }
 * @returns {Promise<Object>}
 */
export const createTimelineEventService = async (data) => {
    const { incidentId, apiKeyId, type, message, metadata, createdBy, authorName, isPublic } = data;

    // Security check: Ensure incident belongs to the correct scope
    const incident = await getIncidentByIdDAO(incidentId, apiKeyId);
    if (!incident) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized access to this incident");
    }

    return await createTimelineEventDAO({
        type: type || TIMELINE_EVENTS.NOTE_ADDED,
        incidentId,
        message,
        metadata: metadata || {},
        createdBy,
        authorName,
        isPublic: isPublic !== undefined ? isPublic : true,
    });
};

/**
 * Loads recent timeline events for a single incident with pagination.
 * @param {string} incidentId
 * @param {string} apiKeyId
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const getTimelineEventsByIncidentService = async (incidentId, apiKeyId, page = 1, limit = 20) => {
    // Security check
    const incident = await getIncidentByIdDAO(incidentId, apiKeyId);
    if (!incident) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized access to this incident");
    }

    return await getTimelineEventsByIncidentDAO(incidentId, page, limit);
};

/**
 * ARCHITECTURE FIX: Internal utility for services to log events without repeated ownership checks.
 * Use this for auto-logs (status changes, creation, etc.)
 */
export const autoLogTimelineEvent = async ({ incidentId, apiKeyId, type, message, metadata, user }) => {
    try {
        return await createTimelineEventDAO({
            type,
            incidentId,
            message,
            metadata: metadata || {},
            createdBy: user?._id || user?.userId || null,
            authorName: user?.name || "System",
            isPublic: true,
        });
    } catch (error) {
        // We log error but don't throw to prevent side-effect failures from crashing the main flow
        console.error("[Timeline] Auto-log failed:", error.message);
        return null;
    }
};



