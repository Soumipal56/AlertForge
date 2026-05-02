import { sendIncidentEmail } from "./email.service.js";
import { sendWhatsApp } from "./whatsapp.service.js";
import { sendWebhookNotification } from "./webhook.service.js";
import { sendTelegramNotification } from "./telegram.service.js";

/**
 * Sends notifications across all enabled channels (Email, Discord, Telegram)
 * @param {Object} user - The user document with notification settings
 * @param {Object} incident - The created incident document
 */
export const sendIncidentNotifications = async (user, incident) => {
    const incidentId = incident._id?.toString() || incident.id;
    const warRoomLink = `http://localhost:5173/warroom/${incidentId}`;
    const message = `🚨 Incident Alert\nMessage: ${incident.message}\nService: ${incident.service}\nSeverity: ${incident.severity}\nJoin: ${warRoomLink}`;

    const channels = [];

    // 1. EMAIL LOGIC
    if (user.notificationSettings?.emailEnabled) {
        try {
            const recipientEmails = Array.from(new Set([
                user.email,
                user.emailAddress,
                ...(user.teamEmails || [])
            ])).filter(Boolean);

            if (recipientEmails.length > 0) {
                const emailPromises = recipientEmails.map(email => 
                    sendIncidentEmail({
                        to: email,
                        subject: `🚨 AlertForge: ${incident.service} - ${incident.severity.toUpperCase()}`,
                        message: `
An incident has been reported.

Message: ${incident.message}
Service: ${incident.service}
Severity: ${incident.severity}

Access the War Room here:
${warRoomLink}
                        `.trim()
                    })
                );
                channels.push(Promise.allSettled(emailPromises));
            }
        } catch (error) {
            console.error("[Notification] Email Error:", error.message);
        }
    }

    // 2. DISCORD LOGIC
    if (user.notificationSettings?.discordEnabled && user.discordWebhookUrl) {
        const sendDiscord = async () => {
            try {
                const response = await fetch(user.discordWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: message
                    })
                });
                if (!response.ok) throw new Error(`Status ${response.status}`);
            } catch (error) {
                console.error("[Notification] Discord Error:", error.message);
            }
        };
        channels.push(sendDiscord());
    }

    // 3. TELEGRAM LOGIC
    if (user.notificationSettings?.telegramEnabled && user.telegramChatId) {
        const sendTelegram = async () => {
            try {
                // Using existing telegram service if it handles token, else direct call
                await sendTelegramNotification(incident, user.telegramChatId, warRoomLink);
            } catch (error) {
                console.error("[Notification] Telegram Error:", error.message);
            }
        };
        channels.push(sendTelegram());
    }

    // 4. WHATSAPP (Backward Compatibility / Extra)
    if (user.preferences?.whatsappEnabled && user.whatsappNumber) {
        channels.push(sendWhatsApp({
            message: `${incident.message}. Join War Room: ${warRoomLink}`,
            dynamicNumber: user.whatsappNumber
        }));
    }

    // Fan-out all channels
    await Promise.allSettled(channels);
};

/**  
 * Legacy Support / Fallback
 */
export const sendIncidentNotification = async (data, userId) => {
    // This is now handled by sendIncidentNotifications in createIncident
    console.warn("sendIncidentNotification is deprecated. Use sendIncidentNotifications instead.");
};
