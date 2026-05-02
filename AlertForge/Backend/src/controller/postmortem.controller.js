import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";
import { generatePostmortem, getPostmortemByIncidentIdService } from "../services/postmortem.service.js";

/**
 * Fetches the stored postmortem for a specific incident.
 */
export const getPostmortemByIncidentId = async (req, res, next) => {
    try {
        const { incidentId } = req.params;
        const postmortem = await getPostmortemByIncidentIdService(incidentId, req.apiKey._id);

        if (!postmortem) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "Postmortem not found");
        }

        return res.json(
            new ApiResponse(
                HTTP_STATUS.OK,
                "Postmortem fetched successfully",
                postmortem
            )
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Manually generates a postmortem for an incident.
 * The service itself is idempotent, so re-triggering this endpoint is safe.
 */
export const generatePostmortemController = async (req, res, next) => {
    try {
        const { incidentId } = req.params;
        const postmortem = await generatePostmortem(incidentId, req.apiKey._id);

        return res.json(
            new ApiResponse(
                HTTP_STATUS.OK,
                "Postmortem generated successfully",
                postmortem
            )
        );
    } catch (error) {
        next(error);
    }
};
