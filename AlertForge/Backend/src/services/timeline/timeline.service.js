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
export const createTimelineEventService = async (data, organizationId) => {
    const { incidentId, apiKeyId, type, message, metadata, createdBy, authorName, isPublic } = data;

    // Security check: Ensure incident belongs to the correct scope
    const incident = await getIncidentByIdDAO(incidentId, organizationId);
    if (!incident) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized access to this incident");
    }

    return await createTimelineEventDAO({
        type: type || TIMELINE_EVENTS.NOTE_ADDED,
        incidentId,
        organizationId,
        message,
        metadata: metadata || {},
        createdBy,
        authorName,
        isPublic: isPublic !== undefined ? isPublic : true,
    });
};

/**
 * Loads recent timeline events for a single incident with pagination.
 */
export const getTimelineEventsByIncidentService = async (incidentId, organizationId, page = 1, limit = 20) => {
    // Security check
    const incident = await getIncidentByIdDAO(incidentId, organizationId);
    if (!incident) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized access to this incident");
    }

    return await getTimelineEventsByIncidentDAO(incidentId, organizationId, page, limit);
};

/**
 * ARCHITECTURE FIX: Internal utility for services to log events without repeated ownership checks.
 */
export const autoLogTimelineEvent = async ({ incidentId, organizationId, type, message, metadata, user }) => {
    try {
        return await createTimelineEventDAO({
            type,
            incidentId,
            organizationId: organizationId || user?.organizationId,
            message,
            metadata: metadata || {},
            createdBy: user?.id || user?._id || user?.userId || null,
            authorName: user?.name || "System",
            isPublic: true,
        });
    } catch (error) {
        console.error("[Timeline] Auto-log failed:", error.message);
        return null;
    }
};




