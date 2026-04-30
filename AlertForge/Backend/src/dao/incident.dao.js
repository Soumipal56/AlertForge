import incidentModel from "../model/Incident.model.js";

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
 * @returns {Array} List of incident documents from the database
 */
export const getAllIncidentsDAO = async () => {
    return await incidentModel.find().sort({ createdAt: -1 });
};