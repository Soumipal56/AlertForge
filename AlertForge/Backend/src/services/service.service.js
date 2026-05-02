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
/**
 * Creates a new service, scoped to the organization.
 */
export const createServiceService = async (data, userId, organizationId) => {
    if (!data.name) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Service name is required");
    }
    return await createServiceDAO({ ...data, userId, organizationId });
};

/**
 * Retrieves all services for the organization.
 */
export const getAllServicesService = async (organizationId) => {
    return await getAllServicesDAO(organizationId);
};

/**
 * Retrieves a single service by ID, validates ownership.
 */
export const getServiceByIdService = async (serviceId, organizationId) => {
    const service = await getServiceByIdDAO(serviceId, organizationId);
    if (!service) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Service not found");
    }
    return service;
};

/**
 * Updates the operational status of a service.
 */
export const updateServiceStatusService = async (serviceId, organizationId, status) => {
    if (!VALID_STATUSES.includes(status)) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`);
    }
    const updated = await updateServiceStatusDAO(serviceId, organizationId, status);
    if (!updated) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Service not found");
    }
    return updated;
};

/**
 * PATCH update for service fields (name, description, url, monitorType, etc.)
 */
export const updateServiceService = async (serviceId, organizationId, updates) => {
    // Remove any fields that shouldn't be patched directly
    delete updates.userId;
    delete updates.organizationId;
    delete updates.incidentCount;

    const updated = await updateServiceDAO(serviceId, organizationId, updates);
    if (!updated) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Service not found");
    }
    return updated;
};

/**
 * Deletes a service.
 */
export const deleteServiceService = async (serviceId, organizationId) => {
    const deleted = await deleteServiceDAO(serviceId, organizationId);
    if (!deleted) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Service not found or already deleted");
    }
    return deleted;
};

/**
 * ARCHITECTURE HARDENING: Automated status sync based on incident load.
 */
import { getIncidentStatsByServiceDAO } from "../dao/incident.dao.js";

export const syncServiceStatusFromIncidentsService = async (serviceName, organizationId, apiKeyId) => {
    try {
        const stats = await getIncidentStatsByServiceDAO(serviceName, organizationId);
        
        let newStatus = "operational";
        if (stats.active > 0) newStatus = "outage";
        else if (stats.monitoring > 0) newStatus = "degraded";

        await updateServiceStatusDAO(null, organizationId, newStatus, serviceName); 
        return newStatus;
    } catch (error) {
        console.error("[Service Sync] Failed to sync status:", error.message);
    }
};

