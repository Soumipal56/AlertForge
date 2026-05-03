import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";
import { generatePostmortem, getPostmortemByIncidentIdService, updatePostmortemService } from "../services/postmortem.service.js";


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

/**
 * FEATURE-5: PATCH /api/postmortem/:incidentId
 * Manually edits a postmortem (summary, rootCause, learnings, actionItems, etc.)
 * Responders can annotate/correct AI-generated content.
 */
export const updatePostmortemController = async (req, res, next) => {
    try {
        const { incidentId } = req.params;
        const apiKeyId = req.apiKey?._id;

        // Whitelist editable fields to prevent mass assignment
        const { summary, rootCause, contributingFactors, actionItems, learnings, debuggingTimeline } = req.body;
        const updates = {};
        if (summary !== undefined) updates.summary = summary;
        if (rootCause !== undefined) updates.rootCause = rootCause;
        if (contributingFactors !== undefined) updates.contributingFactors = contributingFactors;
        if (actionItems !== undefined) updates.actionItems = actionItems;
        if (learnings !== undefined) updates.learnings = learnings;
        if (debuggingTimeline !== undefined) updates.debuggingTimeline = debuggingTimeline;

        const postmortem = await updatePostmortemService(incidentId, apiKeyId, updates);

        return res.json(
            new ApiResponse(HTTP_STATUS.OK, "Postmortem updated", postmortem)
        );
    } catch (error) {
        next(error);
    }
};
