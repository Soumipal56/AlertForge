import { sendIncidentEmail } from "./email.service.js";
import { sendWhatsApp } from "./whatsapp.service.js";
import { sendTelegramNotification } from "./telegram.service.js";
import { sendWebhookNotification } from "./webhook.service.js";

/**
 * Helper to deduplicate arrays and remove falsy values
 */
const getUniqueRecipients = (recipients) => {
    return Array.from(new Set(recipients.filter(Boolean)));
};

/**
 * Sends Email notifications to multiple recipients
 */
export const sendEmailNotifications = async (user, incident, warRoomLink, type) => {
    try {
        if (!user.notificationSettings?.emailEnabled) return;

        const recipients = getUniqueRecipients([
            user.email,
            user.emailAddress,
            ...(user.teamEmails || [])
        ]);

        if (recipients.length === 0) return;

        const emailPromises = recipients.map(email =>
            sendIncidentEmail({
                to: email,
                incident,
                type,
            })
        );

        const results = await Promise.allSettled(emailPromises);
        results.forEach((res, i) => {
            if (res.status === 'rejected') {
                console.error(`[Notification] Email failed for ${recipients[i]}:`, res.reason);
            }
        });
    } catch (error) {
        console.error("[Notification] sendEmailNotifications Error:", error.message);
    }
};

/**
 * Sends Telegram notifications to multiple chat IDs
 */
export const sendTelegramNotifications = async (user, incident, warRoomLink, type) => {
    try {
        if (!user.notificationSettings?.telegramEnabled) return;

        const chatIds = getUniqueRecipients([
            user.telegramChatId,
            ...(user.telegramChatIds || [])
        ]);

        if (chatIds.length === 0) return;

        const telegramPromises = chatIds.map(chatId =>
            sendTelegramNotification(incident, chatId, warRoomLink, type)
        );

        const results = await Promise.allSettled(telegramPromises);
        results.forEach((res, i) => {
            if (res.status === 'rejected') {
                console.error(`[Notification] Telegram failed for ${chatIds[i]}:`, res.reason);
            }
        });
    } catch (error) {
        console.error("[Notification] sendTelegramNotifications Error:", error.message);
    }
};

/**
 * Sends Discord notifications to multiple webhook URLs
 */
export const sendDiscordNotifications = async (user, incident, warRoomLink, type) => {
    try {
        if (!user.notificationSettings?.discordEnabled) return;

        const webhooks = getUniqueRecipients([
            user.discordWebhookUrl,
            ...(user.discordWebhookUrls || [])
        ]);

        if (webhooks.length === 0) return;

        const discordPromises = webhooks.map(url =>
            sendWebhookNotification(incident, url, type)
        );

        const results = await Promise.allSettled(discordPromises);
        results.forEach((res, i) => {
            if (res.status === 'rejected') {
                console.error(`[Notification] Discord failed for ${webhooks[i]}:`, res.reason);
            }
        });
    } catch (error) {
        console.error("[Notification] sendDiscordNotifications Error:", error.message);
    }
};

/**
 * Main fan-out function for all incident notifications
 */
export const sendIncidentNotifications = async (user, incident, type = "INCIDENT_CREATED") => {
    const incidentId = incident._id?.toString() || incident.id;
    const warRoomLink = `http://localhost:5173/warroom/${incidentId}`;

    // Execute all channels in parallel
    await Promise.allSettled([
        sendEmailNotifications(user, incident, warRoomLink, type),
        sendTelegramNotifications(user, incident, warRoomLink, type),
        sendDiscordNotifications(user, incident, warRoomLink, type),
        // Optional Whatsapp legacy
        user.preferences?.whatsappEnabled && user.whatsappNumber ? sendWhatsApp({
            message: `${incident.message || incident.title}. Join War Room: ${warRoomLink}`,
            dynamicNumber: user.whatsappNumber
        }) : Promise.resolve()
    ]);
};

/**
 * Clean wrapper conforming to the new signature
 * @param {Object} params - { incident, user, type }
 */
export const sendIncidentNotification = async ({ incident, user, type }) => {
    if (!user) {
        console.warn("[NotificationService] No user provided. Skipping.");
        return;
    }
    await sendIncidentNotifications(user, incident, type);
};
