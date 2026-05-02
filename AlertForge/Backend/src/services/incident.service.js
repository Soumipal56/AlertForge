import { createIncidentDAO, getAllIncidentsDAO, getIncidentByIdDAO, updateIncidentStatusDAO, getIncidentCountsDAO } from "../dao/incident.dao.js";
import { fetchTavilyInsights } from "./ai/tavily.service.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, INCIDENT_STATUS } from "../config/constants.js";

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
 * @description Service function to retrieve all incidents from the database with status filtering and counts
 * @returns {Object} { incidents: Array, counts: Object }
 */
export const getAllIncidentsService = async (apiKeyId, status = "all") => {
    if (!apiKeyId) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    }

    // 1. Fetch filtered incidents
    const incidents = await getAllIncidentsDAO(apiKeyId, status);

    // 2. Fetch aggregation counts
    const aggregation = await getIncidentCountsDAO(apiKeyId);

    // 3. Transform aggregation into a clean counts object with defaults
    const counts = {
        all: 0,
        investigating: 0,
        identified: 0,
        monitoring: 0,
        resolved: 0,
        open: 0, // Inclusion for system consistency
    };

    let total = 0;
    aggregation.forEach(item => {
        if (counts.hasOwnProperty(item._id)) {
            counts[item._id] = item.count;
        }
        total += item.count;
    });
    counts.all = total;

    return { incidents, counts };
};


/**  
 * @description Service function to retrieve a single incident by its ID from the database
 * @param {string} id - The ID of the incident to retrieve
 * @returns {Object} The incident document from the database, or null if not found
 */
export const getIncidentByIdService = async (id, apiKeyId) => {
    if (!apiKeyId) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    }

    return await getIncidentByIdDAO(id, apiKeyId);
};

/**  
 * @description Service function to update the status of an incident in the database
 * @param {string} id - The ID of the incident to update
 * @param {string} status - The new status to set for the incident
 * @returns {Object} The updated incident document from the database, or null if not found
 */
export const updateIncidentStatusService = async (id, apiKeyId, status, extraUpdates = {}) => {
    if (!apiKeyId) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    }

    return await updateIncidentStatusDAO(id, apiKeyId, status, extraUpdates);
};
