import { sendIncidentEmail } from "./email.service.js";
import { sendWhatsApp } from "./whatsapp.service.js";
import { sendWebhookNotification } from "./webhook.service.js";
import { sendTelegramNotification } from "./telegram.service.js";
import User from "../../model/User.model.js";

/**  
 * Sends an incident notification to the authenticated user.
 * @param {Object} data - The incident data.
 * @param {string} userId - The MongoDB user ID to notify.
 * @returns {Promise<void>}
 */
export const sendIncidentNotification = async (data, identifier) => {
    try {
        // Fetch user notification settings by either MongoDB _id or clerkId
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(identifier);
        const settings = isMongoId
            ? await User.findById(identifier)
            : await User.findOne({ clerkId: identifier });

        if (!settings) {
            console.warn(`No notification settings found for identifier: ${identifier}`);
            // Fallback for demo or if data.to is provided
            if (data.to) {
                await sendIncidentEmail({
                    to: data.to,
                    subject: "New Incident Created",
                    message: data.message,
                });
            }
            return;
        }

        const { preferences, telegramChatId, discordWebhookUrl, emailAddress, whatsappNumber } = settings;

        // 1. Email Notification
        if (preferences.emailEnabled && (emailAddress || data.to)) {
            await sendIncidentEmail({
                to: emailAddress || data.to,
                subject: `🚨 New Incident: ${data.service}`,
                message: data.message,
            });
        }

        // 2. Telegram Notification
        if (preferences.telegramEnabled && telegramChatId) {
            await sendTelegramNotification(data, telegramChatId);
        }

        // 3. Webhook Notification (Discord/Slack)
        if (preferences.webhookEnabled && discordWebhookUrl) {
            await sendWebhookNotification(data, discordWebhookUrl);
        }

        // 4. WhatsApp Notification
        if (preferences.whatsappEnabled && whatsappNumber) {
            await sendWhatsApp({
                message: data.message,
                dynamicNumber: whatsappNumber
            });
        }

    } catch (error) {
        console.error("Error sending dynamic incident notification:", error);
    }
};
