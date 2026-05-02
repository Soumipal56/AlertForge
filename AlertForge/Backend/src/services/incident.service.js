import { createIncidentDAO, getAllIncidentsDAO, getIncidentByIdDAO,updateIncidentStatusDAO } from "../dao/incident.dao.js";
import { fetchTavilyInsights } from "./ai/tavily.service.js";

/**  
 * @description Service function to create a new incident by calling the corresponding DAO function
 * @param {Object} data - Incident data containing message, service, severity, etc.
 * @returns {Object} The created incident document from the database
 */
export const createIncidentService = async (data) => {
    // Fetch real-world insights asynchronously but await it before saving
    // If it fails, the service handles the error and returns an empty string
    const { summary } = await fetchTavilyInsights(data.message, data.service, data.severity);
    if (summary) {
        data.realWorldInsights = summary;
    }

    return await createIncidentDAO(data);
};
/**  
 * @description Service function to retrieve all incidents from the database
 * @returns {Array} List of incident documents from the database
 */
export const getAllIncidentsService = async () => {
    return await getAllIncidentsDAO();
};

/**  
 * @description Service function to retrieve a single incident by its ID from the database
 * @param {string} id - The ID of the incident to retrieve
 * @returns {Object} The incident document from the database, or null if not found
 */
export const getIncidentByIdService = async (id) => {
    return await getIncidentByIdDAO(id);
};

/**  
 * @description Service function to update the status of an incident in the database
 * @param {string} id - The ID of the incident to update
 * @param {string} status - The new status to set for the incident
 * @returns {Object} The updated incident document from the database, or null if not found
 */
export const updateIncidentStatusService = async (id, status, extraUpdates = {}) => {
    return await updateIncidentStatusDAO(id, status, extraUpdates);
};
