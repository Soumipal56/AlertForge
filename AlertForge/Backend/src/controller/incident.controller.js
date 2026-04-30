import { createIncidentService } from "../services/incident.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { incidentSchema } from "../validators/incident.validator.js";


/**  
 * @description Controller to create a new incident
 * @param {Object} req - Express request object containing incident data in body
 * @param {Object} res - Express response object to send back the created incident
 * @returns {Object} JSON response with message and created incident data
 */
export const createIncident = async (req, res, next) => {
    try {
        const data = req.body;

        const validation = incidentSchema.safeParse(data);
        if (!validation.success) {
            throw new ApiError(400, validation.error.errors[0].message);
        }

        const incident = await createIncidentService(data);

        return res
            .status(201)
            .json(new ApiResponse(201, "Incident created", incident));

    } catch (error) {
        next(error); // VERY IMPORTANT
    }
};