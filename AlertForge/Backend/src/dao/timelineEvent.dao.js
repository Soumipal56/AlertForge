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
 * Fetches recent timeline entries for a given incident with pagination.
 * @param {string} incidentId
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const getTimelineEventsByIncidentDAO = async (incidentId, organizationId, page = 1, limit = 20) => {
    const safeLimit = Math.min(limit || 20, 50);
    const skip = (page - 1) * safeLimit;

    return await timelineEventModel
        .find({ incidentId, organizationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean();
};



