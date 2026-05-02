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
/**
 * GET /api/services
 * Returns all services for the organization.
 */
export const getAllServices = async (req, res, next) => {
    try {
        const services = await getAllServicesService(req.user.organizationId);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Services fetched", services));
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/services
 * Creates a new service in the registry.
 */
export const createService = async (req, res, next) => {
    try {
        const service = await createServiceService(req.body, req.user.id, req.user.organizationId);
        return res.status(HTTP_STATUS.CREATED).json(
            new ApiResponse(HTTP_STATUS.CREATED, "Service created", service)
        );
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/services/:id
 */
export const getServiceById = async (req, res, next) => {
    try {
        const service = await getServiceByIdService(req.params.id, req.user.organizationId);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Service fetched", service));
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/services/:id
 */
export const updateService = async (req, res, next) => {
    try {
        const service = await updateServiceService(req.params.id, req.user.organizationId, req.body);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Service updated", service));
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/services/:id/status
 */
export const updateServiceStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const service = await updateServiceStatusService(req.params.id, req.user.organizationId, status);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Service status updated", service));
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/services/:id
 */
export const deleteService = async (req, res, next) => {
    try {
        await deleteServiceService(req.params.id, req.user.organizationId);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Service deleted"));
    } catch (error) {
        next(error);
    }
};

