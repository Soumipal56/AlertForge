// FEATURE-6: Service Registry Service Layer
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../config/constants.js";
import {
    createServiceDAO,
    getAllServicesDAO,
    getServiceByIdDAO,
    updateServiceStatusDAO,
    updateServiceDAO,
    deleteServiceDAO,
} from "../dao/service.dao.js";

const VALID_STATUSES = ["operational", "degraded", "outage"];

/**
 * Creates a new service, scoped to the user.
 * Input: { name, description, url, monitorType }, userId
 * Output: created service document
 */
export const createServiceService = async (data, userId) => {
    if (!data.name) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Service name is required");
    }
    return await createServiceDAO({ ...data, userId });
};

/**
 * Retrieves all services for the authenticated user.
 * Input: userId
 * Output: Array of service documents
 */
export const getAllServicesService = async (userId) => {
    return await getAllServicesDAO(userId);
};

/**
 * Retrieves a single service by ID, validates ownership.
 * Throws 404 if not found or not owned.
 */
export const getServiceByIdService = async (serviceId, userId) => {
    const service = await getServiceByIdDAO(serviceId, userId);
    if (!service) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Service not found");
    }
    return service;
};

/**
 * Updates the operational status of a service.
 * Enforces valid status enum. Returns updated document.
 */
export const updateServiceStatusService = async (serviceId, userId, status) => {
    if (!VALID_STATUSES.includes(status)) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`);
    }
    const updated = await updateServiceStatusDAO(serviceId, userId, status);
    if (!updated) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Service not found");
    }
    return updated;
};

/**
 * PATCH update for service fields (name, description, url, monitorType, etc.)
 */
export const updateServiceService = async (serviceId, userId, updates) => {
    // Remove any fields that shouldn't be patched directly
    delete updates.userId;
    delete updates.incidentCount;
    const updated = await updateServiceDAO(serviceId, userId, updates);
    if (!updated) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Service not found");
    }
    return updated;
};

/**
 * Deletes a service. Validates ownership before deletion.
 */
export const deleteServiceService = async (serviceId, userId) => {
    const deleted = await deleteServiceDAO(serviceId, userId);
    if (!deleted) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Service not found or already deleted");
    }
    return deleted;
};/**
 * ARCHITECTURE HARDENING: Automated status sync based on incident load.
 */
import { getIncidentStatsByServiceDAO } from "../dao/incident.dao.js";

export const syncServiceStatusFromIncidentsService = async (serviceName, userId, apiKeyId) => {
    try {
        const stats = await getIncidentStatsByServiceDAO(serviceName, apiKeyId);
        
        let newStatus = "operational";
        if (stats.active > 0) newStatus = "outage";
        else if (stats.monitoring > 0) newStatus = "degraded";

        await updateServiceStatusDAO(null, userId, newStatus, serviceName); 
        return newStatus;
    } catch (error) {
        console.error("[Service Sync] Failed to sync status:", error.message);
    }
};
