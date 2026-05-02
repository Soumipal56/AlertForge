// FEATURE-6: Service Registry Controller
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";
import {
    createServiceService,
    getAllServicesService,
    getServiceByIdService,
    updateServiceStatusService,
    updateServiceService,
    deleteServiceService,
} from "../services/service.service.js";

/**
 * GET /api/services
 * Returns all services for the authenticated user.
 */
export const getAllServices = async (req, res, next) => {
    try {
        const userId = req.user?.userId || req.user?._id?.toString();
        const services = await getAllServicesService(userId);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Services fetched", services));
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/services
 * Creates a new service in the registry.
 * Body: { name, description, url, monitorType }
 */
export const createService = async (req, res, next) => {
    try {
        const userId = req.user?.userId || req.user?._id?.toString();
        const service = await createServiceService(req.body, userId);
        return res.status(HTTP_STATUS.CREATED).json(
            new ApiResponse(HTTP_STATUS.CREATED, "Service created", service)
        );
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/services/:id
 * Fetches a single service by ID.
 */
export const getServiceById = async (req, res, next) => {
    try {
        const userId = req.user?.userId || req.user?._id?.toString();
        const service = await getServiceByIdService(req.params.id, userId);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Service fetched", service));
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/services/:id
 * Updates service fields (name, description, url, monitorType, uptimePercent).
 */
export const updateService = async (req, res, next) => {
    try {
        const userId = req.user?.userId || req.user?._id?.toString();
        const service = await updateServiceService(req.params.id, userId, req.body);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Service updated", service));
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/services/:id/status
 * Updates only the operational status of a service.
 * Body: { status: "operational" | "degraded" | "outage" }
 */
export const updateServiceStatus = async (req, res, next) => {
    try {
        const userId = req.user?.userId || req.user?._id?.toString();
        const { status } = req.body;
        const service = await updateServiceStatusService(req.params.id, userId, status);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Service status updated", service));
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/services/:id
 * Deletes a service from the registry.
 */
export const deleteService = async (req, res, next) => {
    try {
        const userId = req.user?.userId || req.user?._id?.toString();
        await deleteServiceService(req.params.id, userId);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Service deleted"));
    } catch (error) {
        next(error);
    }
};
