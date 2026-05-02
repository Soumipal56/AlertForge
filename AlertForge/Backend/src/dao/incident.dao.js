import mongoose from "mongoose";
import incidentModel from "../model/Incident.model.js";
import { INCIDENT_STATUS } from "../config/constants.js";

/**  
 * @description DAO function to create a new incident in the database
 * @param {Object} data - Incident data containing message, service, severity, etc.
 * @returns {Object} The created incident document from the database
 */
export const createIncidentDAO = async (data) => {
    return await incidentModel.create(data);
};

/**  
 * @description DAO function to retrieve all incidents from the database, sorted by creation date
 * Supports optional status-based filtering.
 * @returns {Array} List of incident documents from the database
 */
export const getAllIncidentsDAO = async (apiKeyId, status = null) => {
    const query = { apiKeyId };
    if (status && status !== "all") {
        query.status = status;
    }
    
    const incidents = await incidentModel.find(query).sort({ createdAt: -1 }).lean();
    
    // Standardize 'message' -> 'title' mapping
    return incidents.map(incident => ({
        ...incident,
        title: incident.title || incident.message
    }));
};



/**
 * @description DAO function to aggregate incident counts grouped by status.
 * Filters for only valid statuses and scopes by API Key.
 * @returns {Array} List of counts per status.
 */
export const getIncidentCountsDAO = async (apiKeyId) => {
    const validStatuses = Object.values(INCIDENT_STATUS);
    return await incidentModel.aggregate([
        { 
            $match: { 
                apiKeyId: new mongoose.Types.ObjectId(apiKeyId),
                status: { $in: validStatuses }
            } 
        },
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
};



/**  
 * @description DAO function to retrieve a single incident by its ID from the database
 * @param {string} id - The ID of the incident to retrieve
 * @returns {Object} The incident document from the database, or null if not found
 */
export const getIncidentByIdDAO = async (id, apiKeyId) => {
    const incident = await incidentModel.findOne({ _id: id, apiKeyId }).lean();
    if (!incident) return null;
    
    return {
        ...incident,
        title: incident.title || incident.message
    };
};

/**  
 * @description DAO function to update the status of an incident in the database
 * @param {string} id - The ID of the incident to update
 * @param {string} status - The new status to set for the incident
 * @returns {Object} The updated incident document from the database, or null if not found
 */
export const updateIncidentStatusDAO = async (id, apiKeyId, status, extraUpdates = {}) => {
    return await incidentModel.findOneAndUpdate(
        { _id: id, apiKeyId },
        { $set: { status, ...extraUpdates } },
        { returnDocument: "after", runValidators: true }
    );
};
