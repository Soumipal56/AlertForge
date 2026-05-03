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
 */
export const getAllIncidentsDAO = async (organizationId, status = null) => {
    const query = { organizationId };
    if (status && status !== "all") {
        query.status = status;
    }
    
    const incidents = await incidentModel.find(query).sort({ createdAt: -1 }).lean();
    
    return incidents.map(incident => ({
        ...incident,
        title: incident.title || incident.message
    }));
};

/**
 * @description DAO function to aggregate incident counts grouped by status.
 */
export const getIncidentCountsDAO = async (organizationId) => {
    const validStatuses = Object.values(INCIDENT_STATUS);
    return await incidentModel.aggregate([
        { 
            $match: { 
                organizationId: new mongoose.Types.ObjectId(organizationId),
                status: { $in: validStatuses }
            } 
        },
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
};

/**  
 * @description DAO function to retrieve a single incident by its ID from the database
 */
export const getIncidentByIdDAO = async (id, organizationId) => {
    const incident = await incidentModel.findOne({ _id: id, organizationId }).lean();
    if (!incident) return null;
    
    return {
        ...incident,
        title: incident.title || incident.message
    };
};

/**  
 * @description DAO function to update the severity of an incident
 */
export const updateIncidentSeverityDAO = async (id, organizationId, severity) => {
    return await incidentModel.findOneAndUpdate(
        { _id: id, organizationId },
        { $set: { severity } },
        { returnDocument: "after", runValidators: true }
    ).lean();
};

/**  
 * @description DAO function to update the status of an incident
 */
export const updateIncidentStatusDAO = async (id, organizationId, status, extraUpdates = {}) => {
    return await incidentModel.findOneAndUpdate(
        { _id: id, organizationId },
        { $set: { status, ...extraUpdates } },
        { returnDocument: "after", runValidators: true }
    ).lean();
};

/**
 * Returns counts of active/monitoring incidents for a service to drive status sync.
 */
export const getIncidentStatsByServiceDAO = async (serviceName, organizationId) => {
    const results = await incidentModel.aggregate([
        { 
            $match: { 
                service: serviceName, 
                organizationId: new mongoose.Types.ObjectId(organizationId),
                status: { $ne: INCIDENT_STATUS.RESOLVED } 
            } 
        },
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const stats = { active: 0, monitoring: 0 };
    results.forEach(res => {
        if (res._id === INCIDENT_STATUS.MONITORING) stats.monitoring += res.count;
        else stats.active += res.count; 
    });
    return stats;
};

/**
 * Returns sum of durations of resolved incidents for a service in the last X days.
 */
export const getIncidentDurationsByServiceDAO = async (serviceName, organizationId, days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await incidentModel.aggregate([
        {
            $match: {
                service: serviceName,
                organizationId: new mongoose.Types.ObjectId(organizationId),
                status: INCIDENT_STATUS.RESOLVED,
                resolvedAt: { $gte: startDate }
            }
        },
        {
            $project: {
                duration: { $subtract: ["$resolvedAt", "$startedAt"] }
            }
        },
        {
            $group: {
                _id: null,
                totalDuration: { $sum: "$duration" }
            }
        }
    ]);

    return results.length > 0 ? results[0].totalDuration : 0;
};

