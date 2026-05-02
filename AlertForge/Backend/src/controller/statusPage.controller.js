// FEATURE-9: Public Status Page Controller
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";
import { getPublicStatusService } from "../services/statusPage.service.js";

/**
 * GET /api/status-page/public/:userId
 * Public endpoint — no auth required.
 * Returns aggregated system health, service metrics, and incident history.
 */
export const getPublicStatusPage = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const data = await getPublicStatusService(userId);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Status page fetched", data));
    } catch (error) {
        next(error);
    }
};


