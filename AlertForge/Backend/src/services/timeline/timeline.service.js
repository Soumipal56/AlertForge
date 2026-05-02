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
 * Ensures the incident is within the user's API Key scope.
 * @param {string} incidentId
 * @param {string} apiKeyId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const getTimelineEventsByIncidentService = async (incidentId, apiKeyId, limit = 50) => {
    const safeLimit = Math.min(limit, 100); // Prevent excessive data fetching
    return await getTimelineEventsByIncidentDAO(incidentId, apiKeyId, safeLimit);
};

