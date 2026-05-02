import { createIncidentService } from "../services/incident.service.js";
import { sendIncidentNotifications } from "../services/notification/notification.service.js";
import { hashKey } from "../utils/hashKey.js";
import { findActiveApiKeyByHashedKeyDAO } from "../dao/apikey.dao.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";
import { emitNewIncident } from "../services/socket/socket.service.js";

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

        const hashedKey = hashKey(apiKey);
        const apiKeyDoc = await findActiveApiKeyByHashedKeyDAO(hashedKey);

        if (!apiKeyDoc) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json(new ApiResponse(HTTP_STATUS.UNAUTHORIZED, "Invalid API Key"));
        }

        let incidentData = {};

        // 1. Check if it's a Discord-formatted payload (UptimeRobot Trick)
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
        }
        // 2. Handle Standard UptimeRobot payload
        else {
            const isDown = payload.alertType === "2" || payload.alertType === 2;
            incidentData = {
                message: `[UptimeRobot] ${payload.alertDetails || "No details provided"}`,
                service: payload.monitorFriendlyName || "External Service",
                severity: isDown ? "high" : "low",
                status: isDown ? "open" : "resolved",
                apiKeyId: apiKeyDoc._id,
            };
        }

        const incident = await createIncidentService(incidentData);
        
        if (apiKeyDoc.user) {
            sendIncidentNotifications(apiKeyDoc.user, incident);
        }

        emitNewIncident(incident);

        return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, "Alert processed", incident));

    } catch (error) {
        console.error("[Webhook] Processing Error:", error.message);
        next(error);
    }
};
