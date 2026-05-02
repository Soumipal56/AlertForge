import timelineEventModel from "../model/TimelineEvent.model.js";

/**
 * Persists a new timeline event in MongoDB.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const createTimelineEventDAO = async (data) => {
    return await timelineEventModel.create(data);
};

/**
 * Fetches recent timeline entries for a given incident.
 * Ensures the incident belongs to the correct API Key scope.
 * @param {string} incidentId
 * @param {string} apiKeyId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const getTimelineEventsByIncidentDAO = async (incidentId, apiKeyId, limit = 50) => {
    return await timelineEventModel
        .find({ incidentId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

