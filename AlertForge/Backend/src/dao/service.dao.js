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
 * Fetches all services for a given user.
 * @param {string} userId
 */
export const getAllServicesDAO = async (userId) => {
    return await serviceModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .lean();
};

/**
 * Fetches a single service by ID, scoped to the user.
 * @param {string} serviceId
 * @param {string} userId
 */
export const getServiceByIdDAO = async (serviceId, userId) => {
    return await serviceModel
        .findOne({ _id: serviceId, userId })
        .lean();
};

/**
 * Updates the status of a service (operational/degraded/outage).
 * @param {string} serviceId
 * @param {string} userId
 * @param {string} status
 */
export const updateServiceStatusDAO = async (serviceId, userId, status) => {
    return await serviceModel.findOneAndUpdate(
        { _id: serviceId, userId },
        { $set: { status } },
        { returnDocument: "after", runValidators: true }
    ).lean();
};

/**
 * Updates arbitrary service fields (for PATCH requests).
 * @param {string} serviceId
 * @param {string} userId
 * @param {Object} updates
 */
export const updateServiceDAO = async (serviceId, userId, updates) => {
    return await serviceModel.findOneAndUpdate(
        { _id: serviceId, userId },
        { $set: updates },
        { returnDocument: "after", runValidators: true }
    ).lean();
};

/**
 * Deletes a service owned by the user.
 * @param {string} serviceId
 * @param {string} userId
 */
export const deleteServiceDAO = async (serviceId, userId) => {
    return await serviceModel.findOneAndDelete({ _id: serviceId, userId });
};

/**
 * Increments the incident count for a service (called when incident is created).
 * @param {string} serviceId
 * @param {string} userId
 */
export const incrementServiceIncidentCountDAO = async (serviceName, userId) => {
    return await serviceModel.findOneAndUpdate(
        { name: serviceName, userId },
        { $inc: { incidentCount: 1 } },
        { returnDocument: "after" }
    );
};
