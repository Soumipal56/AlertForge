import { createIncidentService } from "../services/incident.service.js";
import { extractKeyId } from "../utils/hashKey.js";
import { findActiveApiKeyByKeyIdDAO } from "../dao/apikey.dao.js";
import bcrypt from "bcryptjs";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * @description Flexible Webhook for UptimeRobot (Handles standard and Discord formats)
 */
export const uptimerobotWebhook = async (req, res, next) => {
    try {
        const { apiKey } = req.query;
        const payload = req.body;

        if (!apiKey) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json(new ApiResponse(HTTP_STATUS.UNAUTHORIZED, "API Key is required in query params"));
        }

        const keyId = extractKeyId(apiKey);
        const apiKeyDoc = await findActiveApiKeyByKeyIdDAO(keyId);

        if (!apiKeyDoc) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json(new ApiResponse(HTTP_STATUS.UNAUTHORIZED, "Invalid API Key"));
        }

        const isMatch = await bcrypt.compare(apiKey, apiKeyDoc.hashedKey);
        if (!isMatch) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json(new ApiResponse(HTTP_STATUS.UNAUTHORIZED, "Invalid API Key"));
        }

        if (!apiKeyDoc.user) {
            console.warn("[Webhook] No user found on apiKeyDoc. Incident creation skipped.");
            return res.status(HTTP_STATUS.UNAUTHORIZED).json(new ApiResponse(HTTP_STATUS.UNAUTHORIZED, "API key is not linked to a user"));
        }

        let incidentData = {};

        if (payload.embeds && payload.embeds.length > 0) {
            const embed = payload.embeds[0];
            const isDown = embed.title.toLowerCase().includes("down");

            incidentData = {
                message: `[Discord Webhook] ${embed.description || embed.title}`,
                service: "External Monitor",
                severity: isDown ? "high" : "low",
                status: isDown ? "open" : "resolved",
                apiKeyId: apiKeyDoc._id,
            };
        } else {
            const isDown = payload.alertType === "2" || payload.alertType === 2;
            incidentData = {
                message: `[UptimeRobot] ${payload.alertDetails || "No details provided"}`,
                service: payload.monitorFriendlyName || "External Service",
                severity: isDown ? "high" : "low",
                status: isDown ? "open" : "resolved",
                apiKeyId: apiKeyDoc._id,
            };
        }

        const incident = await createIncidentService(incidentData, apiKeyDoc.user, apiKeyDoc, true);

        console.log("[Webhook] Resolved user object:", JSON.stringify(apiKeyDoc.user, null, 2));
        console.log("[Webhook] Incident created and broadcasted:", incident._id?.toString());

        return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, "Alert processed", incident));
    } catch (error) {
        console.error("[Webhook] Processing Error:", error.message);
        next(error);
    }
};
