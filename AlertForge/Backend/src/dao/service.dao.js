// FEATURE-6: Service Registry DAO
// All queries are scoped by userId for multi-tenant safety
import serviceModel from "../model/Service.model.js";
import mongoose from "mongoose";

/**
 * Creates a new service in the registry.
 * @param {Object} data - { name, description, url, userId, monitorType }
 */
export const createServiceDAO = async (data) => {
    return await serviceModel.create(data);
};

/**
 * Fetches all services for a given organization.
 */
export const getAllServicesDAO = async (organizationId) => {
    return await serviceModel
        .find({ organizationId })
        .sort({ createdAt: -1 })
        .lean();
};

/**
 * Fetches a single service by ID, scoped to the organization.
 */
export const getServiceByIdDAO = async (serviceId, organizationId) => {
    return await serviceModel
        .findOne({ _id: serviceId, organizationId })
        .lean();
};

/**
 * Updates the status of a service (operational/degraded/outage).
 */
export const updateServiceStatusDAO = async (serviceId, organizationId, status, serviceName = null) => {
    const filter = { organizationId };
    if (serviceId) filter._id = serviceId;
    if (serviceName) filter.name = serviceName;

    return await serviceModel.findOneAndUpdate(
        filter,
        { $set: { status } },
        { returnDocument: "after", runValidators: true }
    ).lean();
};

/**
 * Updates arbitrary service fields (for PATCH requests).
 */
export const updateServiceDAO = async (serviceId, organizationId, updates) => {
    return await serviceModel.findOneAndUpdate(
        { _id: serviceId, organizationId },
        { $set: updates },
        { returnDocument: "after", runValidators: true }
    ).lean();
};

/**
 * Deletes a service owned by the organization.
 */
export const deleteServiceDAO = async (serviceId, organizationId) => {
    return await serviceModel.findOneAndDelete({ _id: serviceId, organizationId });
};

export const findServiceByNameDAO = async (name, organizationId) => {
    return await serviceModel.findOne({ name, organizationId }).lean();
};

/**
 * Increments the incident count for a service.
 */
export const incrementServiceIncidentCountDAO = async (serviceName, organizationId) => {
    return await serviceModel.findOneAndUpdate(
        { name: serviceName, organizationId },
        { $inc: { incidentCount: 1 } },
        { returnDocument: "after" }
    ).lean();
};


