import { createTimelineEventDAO, getTimelineEventsByIncidentDAO } from "../../dao/timelineEvent.dao.js";

/**
 * Saves a durable timeline entry after an incident lifecycle change.
 * @param {{ type: string, incidentId: string, message?: string }} data
 * @returns {Promise<Object>}
 */
export const createTimelineEventService = async (data) => {
    return await createTimelineEventDAO(data);
};

/**
 * Loads recent timeline events for a single incident.
 * @param {string} incidentId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const getTimelineEventsByIncidentService = async (incidentId, limit = 50) => {
    return await getTimelineEventsByIncidentDAO(incidentId, limit);
};
