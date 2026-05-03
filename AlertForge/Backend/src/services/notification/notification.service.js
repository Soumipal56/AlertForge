import { sendIncidentEmail } from "./email.service.js";
import { sendWhatsApp } from "./whatsapp.service.js";
import { sendTelegramNotification } from "./telegram.service.js";
import { sendWebhookNotification } from "./webhook.service.js";
import { getTeamMembersDAO, findUserByIdDAO } from "../../dao/user.dao.js";
import { buildWarRoomLink, generateWarRoomToken } from "../../utils/warRoomToken.js";
import logger from "../../utils/logger.js";
import { retry } from "../../utils/retry.js";

const getIncidentId = (incident) => incident?._id?.toString() || incident?.id?.toString();

const getUniqueRecipients = (recipients) => {
    return Array.from(new Set(recipients.filter(Boolean)));
};

const getUniqueUsers = (users) => {
    const usersById = new Map();
    users.filter(Boolean).forEach((user) => {
        const userId = user?._id?.toString() || user?.id?.toString();
        if (userId && !usersById.has(userId)) {
            usersById.set(userId, user);
        }
    });
    return Array.from(usersById.values());
};

const createIncidentNotificationPayload = (incident, organizationId, type = "INCIDENT_CREATED") => {
    const incidentId = getIncidentId(incident);
    const resolvedOrganizationId = incident?.organizationId || organizationId;
    const joinToken = incident?.joinToken || generateWarRoomToken({ incidentId, organizationId: resolvedOrganizationId });
    const warRoomLink = buildWarRoomLink({ incidentId, token: joinToken });

    return {
        type,
        title: incident?.title || incident?.message || "N/A",
        service: incident?.service || "N/A",
        severity: incident?.severity || "N/A",
        status: incident?.status || "N/A",
        incidentId,
        joinToken,
        warRoomLink,
        incident
    };
};

export const sendEmailNotifications = async (user, payload) => {
    const userId = user?._id?.toString() || user?.id || "unknown";

    if (user?.notificationSettings?.emailEnabled === false) {
        logger.info(`[Notification:email] Skipped for user ${userId}: email notifications explicitly disabled`);
        return { sent: 0, failed: 0, skipped: true };
    }

    const recipients = getUniqueRecipients([user.email, user.emailAddress, ...(user.teamEmails || [])]);

    if (recipients.length === 0) {
        logger.warn(`[Notification:email] Skipped for user ${userId}: no email recipients configured`);
        return { sent: 0, failed: 0, skipped: true };
    }

    const results = await Promise.allSettled(
        recipients.map((email) => 
            retry(() => sendIncidentEmail({ to: email, payload }), 3, 1000, `Email to ${email}`)
        )
    );

    return {
        sent: results.filter((result) => result.status === "fulfilled").length,
        failed: results.filter((result) => result.status === "rejected").length,
        skipped: false
    };
};

export const sendTelegramNotifications = async (user, payload) => {
    const userId = user?._id?.toString() || user?.id || "unknown";

    if (user?.notificationSettings?.telegramEnabled === false) {
        logger.info(`[Notification:telegram] Skipped for user ${userId}: Telegram notifications explicitly disabled`);
        return { sent: 0, failed: 0, skipped: true };
    }

    const chatIds = getUniqueRecipients([user.telegramChatId, ...(user.telegramChatIds || [])]);

    if (chatIds.length === 0) {
        logger.warn(`[Notification:telegram] Skipped for user ${userId}: no Telegram chat IDs configured`);
        return { sent: 0, failed: 0, skipped: true };
    }

    const results = await Promise.allSettled(
        chatIds.map((chatId) => 
            retry(() => sendTelegramNotification({ chatId, payload }), 3, 1000, `Telegram to ${chatId}`)
        )
    );

    return {
        sent: results.filter((result) => result.status === "fulfilled").length,
        failed: results.filter((result) => result.status === "rejected").length,
        skipped: false
    };
};

export const sendDiscordNotifications = async (user, payload) => {
    const userId = user?._id?.toString() || user?.id || "unknown";

    if (user?.notificationSettings?.discordEnabled === false) {
        logger.info(`[Notification:discord] Skipped for user ${userId}: Discord notifications explicitly disabled`);
        return { sent: 0, failed: 0, skipped: true };
    }

    const webhooks = getUniqueRecipients([user.discordWebhookUrl, ...(user.discordWebhookUrls || [])]);

    if (webhooks.length === 0) {
        logger.warn(`[Notification:discord] Skipped for user ${userId}: no Discord webhook URLs configured`);
        return { sent: 0, failed: 0, skipped: true };
    }

    const results = await Promise.allSettled(
        webhooks.map((webhookUrl) => 
            retry(() => sendWebhookNotification({ webhookUrl, payload }), 3, 1000, `Discord Webhook`)
        )
    );

    return {
        sent: results.filter((result) => result.status === "fulfilled").length,
        failed: results.filter((result) => result.status === "rejected").length,
        skipped: false
    };
};

export const sendIncidentNotifications = async (user, incident, type = "INCIDENT_CREATED", options = {}) => {
    const organizationId = options.organizationId || user?.organizationId || incident?.organizationId;
    const payload = options.payload || createIncidentNotificationPayload(incident, organizationId, type);
    const userId = user?._id?.toString() || user?.id || "unknown";

    logger.info(`[Notification] Broadcasting ${payload.type} to user ${userId} for incident ${payload.incidentId}`);

    const channels = [
        { name: "email", run: () => sendEmailNotifications(user, payload) },
        { name: "telegram", run: () => sendTelegramNotifications(user, payload) },
        { name: "discord", run: () => sendDiscordNotifications(user, payload) }
    ];

    if (user?.preferences?.whatsappEnabled && user?.whatsappNumber) {
        channels.push({
            name: "whatsapp",
            run: () => retry(() => sendWhatsApp({
                message: `${payload.title}. Join War Room: ${payload.warRoomLink}`,
                dynamicNumber: user.whatsappNumber
            }), 3, 1000, `WhatsApp to ${user.whatsappNumber}`)
        });
    }

    const results = await Promise.allSettled(channels.map((channel) => channel.run()));

    return {
        userId,
        incidentId: payload.incidentId,
        warRoomLink: payload.warRoomLink,
        channels: results
    };
};

export const broadcastIncident = async (incident, organizationId, type = "INCIDENT_CREATED") => {
    logger.info(`[Broadcast] Initiating ${type} for organization: ${organizationId}`);

    const [adminUser, teamMembers] = await Promise.all([
        findUserByIdDAO(organizationId),
        getTeamMembersDAO(organizationId)
    ]);

    const allUsers = getUniqueUsers([adminUser, ...(teamMembers || [])]);

    if (allUsers.length === 0) {
        logger.warn("[Broadcast] No users found for organization.");
        return { incidentId: getIncidentId(incident), users: [] };
    }

    const payload = createIncidentNotificationPayload(incident, organizationId, type);
    
    // Process notifications in parallel for all users
    const results = await Promise.allSettled(
        allUsers.map((user) => sendIncidentNotifications(user, incident, type, { payload, organizationId }))
    );

    return {
        incidentId: payload.incidentId,
        warRoomLink: payload.warRoomLink,
        users: results
    };
};

export const sendIncidentNotification = async ({ incident, user, type }) => {
    if (!user) return;
    await sendIncidentNotifications(user, incident, type);
};
