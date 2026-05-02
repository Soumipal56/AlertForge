import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";
import { getPostmortemByIncidentIdService } from "../services/postmortem.service.js";

export const getPostmortemByIncidentId = async (req, res, next) => {
    try {
        const { incidentId } = req.params;
        const postmortem = await getPostmortemByIncidentIdService(incidentId);

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
