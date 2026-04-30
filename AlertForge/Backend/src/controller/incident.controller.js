import { createIncidentService, getAllIncidentsService } from "../services/incident.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { incidentSchema } from "../validators/incident.validator.js";
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from "../config/constants.js";

/**  
 * @description Controller function to create a new incident
 * - Validates the request body using Zod schema
 * - Calls the service function to create the incident
 * - Returns a standardized API response with the created incident data
 * @param {Object} req - Express request object containing incident data in req.body
 * @param {Object} res - Express response object used to send the API response
 * @param {Function} next - Express next function for error handling
 * @returns {Object} API response with status code, message, and created incident data
 */
export const createIncident = async (req, res, next) => {
    try {
        const data = req.body;
        //NOTE- here will be validation using zod schema. If validation fails, it will throw an error which will be caught in the catch block and passed to the error handling middleware.
        const validation = incidentSchema.safeParse(data);
        if (!validation.success) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                validation.error.errors[0].message
            );
        }

        const incident = await createIncidentService(data);

        return res
            .status(HTTP_STATUS.CREATED)
            .json(new ApiResponse(
                HTTP_STATUS.CREATED,
                SUCCESS_MESSAGES.INCIDENT.CREATED,
                incident
            ));

    } catch (error) {
        next(error);
    }
};

export const getAllIncidents = async (req, res, next) => {
    try {
        const incidents = await getAllIncidentsService();

        return res.json(new ApiResponse(
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.INCIDENT.FETCHED,
            incidents
        ));

    } catch (error) {
        next(error);
    }
};