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
/**  
 * @description DAO function to retrieve a single incident by its ID from the database
 * @param {string} id - The ID of the incident to retrieve
 * @returns {Object} The incident document from the database, or null if not found
 */
export const getIncidentByIdDAO = async (id) => {
    return await incidentModel.findById(id);
};
/**  
 * @description DAO function to update the status of an incident in the database
 * @param {string} id - The ID of the incident to update
 * @param {string} status - The new status to set for the incident
 * @returns {Object} The updated incident document from the database, or null if not found
 */
export const updateIncidentStatusDAO = async (id, status, extraUpdates = {}) => {
    return await incidentModel.findByIdAndUpdate(
        id,
        { $set: { status, ...extraUpdates } },
        { returnDocument: "after", runValidators: true }
    );
};
