import { sendIncidentEmail } from "./email.service.js";
import { sendWhatsApp } from "./whatsapp.service.js";
import { sendTelegramNotification } from "./telegram.service.js";
import { sendWebhookNotification } from "./webhook.service.js";
import { getTeamMembersDAO, findUserByIdDAO } from "../../dao/user.dao.js";
import { buildWarRoomLink, generateWarRoomToken } from "../../utils/warRoomToken.js";

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

const getErrorMessage = (reason) => {
    if (!reason) return "Unknown error";
    if (reason instanceof Error) return reason.message;
    return typeof reason === "string" ? reason : JSON.stringify(reason);
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

const logSettledResults = (channel, targets, results) => {
    results.forEach((result, index) => {
        const target = targets[index];
        if (result.status === "fulfilled") {
            console.log(`[Notification:${channel}] Sent successfully to ${target}`);
            return;
        }

        console.error(`[Notification:${channel}] Failed for ${target}: ${getErrorMessage(result.reason)}`);
    });
};

export const sendEmailNotifications = async (user, payload) => {
    const userId = user?._id?.toString() || user?.id || "unknown";

    if (!user?.notificationSettings?.emailEnabled) {
        console.log(`[Notification:email] Skipped for user ${userId}: email notifications disabled`);
        return { sent: 0, failed: 0, skipped: true };
    }

    const recipients = getUniqueRecipients([
        user.email,
        user.emailAddress,
        ...(user.teamEmails || [])
    ]);

    if (recipients.length === 0) {
        console.warn(`[Notification:email] Skipped for user ${userId}: no email recipients configured`);
        return { sent: 0, failed: 0, skipped: true };
    }

    const results = await Promise.allSettled(
        recipients.map((email) => sendIncidentEmail({ to: email, payload }))
    );

    logSettledResults("email", recipients, results);

    return {
        sent: results.filter((result) => result.status === "fulfilled").length,
        failed: results.filter((result) => result.status === "rejected").length,
        skipped: false
    };
};

export const sendTelegramNotifications = async (user, payload) => {
    const userId = user?._id?.toString() || user?.id || "unknown";

    if (!user?.notificationSettings?.telegramEnabled) {
        console.log(`[Notification:telegram] Skipped for user ${userId}: Telegram notifications disabled`);
        return { sent: 0, failed: 0, skipped: true };
    }

    const chatIds = getUniqueRecipients([
        user.telegramChatId,
        ...(user.telegramChatIds || [])
    ]);

    if (chatIds.length === 0) {
        console.warn(`[Notification:telegram] Skipped for user ${userId}: no Telegram chat IDs configured`);
        return { sent: 0, failed: 0, skipped: true };
    }

    const results = await Promise.allSettled(
        chatIds.map((chatId) => sendTelegramNotification({ chatId, payload }))
    );

    logSettledResults("telegram", chatIds, results);

    return {
        sent: results.filter((result) => result.status === "fulfilled").length,
        failed: results.filter((result) => result.status === "rejected").length,
        skipped: false
    };
};

export const sendDiscordNotifications = async (user, payload) => {
    const userId = user?._id?.toString() || user?.id || "unknown";

    if (!user?.notificationSettings?.discordEnabled) {
        console.log(`[Notification:discord] Skipped for user ${userId}: Discord notifications disabled`);
        return { sent: 0, failed: 0, skipped: true };
    }

    const webhooks = getUniqueRecipients([
        user.discordWebhookUrl,
        ...(user.discordWebhookUrls || [])
    ]);

    if (webhooks.length === 0) {
        console.warn(`[Notification:discord] Skipped for user ${userId}: no Discord webhook URLs configured`);
        return { sent: 0, failed: 0, skipped: true };
    }

    const results = await Promise.allSettled(
        webhooks.map((webhookUrl) => sendWebhookNotification({ webhookUrl, payload }))
    );

    logSettledResults("discord", webhooks, results);

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

    console.log(`[Notification] Broadcasting ${payload.type} to user ${userId} for incident ${payload.incidentId}`);

    const channels = [
        { name: "email", run: () => sendEmailNotifications(user, payload) },
        { name: "telegram", run: () => sendTelegramNotifications(user, payload) },
        { name: "discord", run: () => sendDiscordNotifications(user, payload) }
    ];

    if (user?.preferences?.whatsappEnabled && user?.whatsappNumber) {
        channels.push({
            name: "whatsapp",
            run: () => sendWhatsApp({
                message: `${payload.title}. Join War Room: ${payload.warRoomLink}`,
                dynamicNumber: user.whatsappNumber
            })
        });
    }

    const results = await Promise.allSettled(channels.map((channel) => channel.run()));

    results.forEach((result, index) => {
        const channelName = channels[index].name;
        if (result.status === "fulfilled") {
            console.log(`[Notification:${channelName}] Completed for user ${userId}`);
            return;
        }

        console.error(`[Notification:${channelName}] Error for user ${userId}: ${getErrorMessage(result.reason)}`);
    });

    return {
        userId,
        incidentId: payload.incidentId,
        warRoomLink: payload.warRoomLink,
        channels: results
    };
};

export const broadcastIncident = async (incident, organizationId, type = "INCIDENT_CREATED") => {
    console.log(`[Broadcast] Fetching users for organization: ${organizationId}`);

    const [adminUser, teamMembers] = await Promise.all([
        findUserByIdDAO(organizationId),
        getTeamMembersDAO(organizationId)
    ]);

    const allUsers = getUniqueUsers([
        adminUser,
        ...(teamMembers || [])
    ]);

    if (allUsers.length === 0) {
        console.warn("[Broadcast] No users found for organization.");
        return { incidentId: getIncidentId(incident), users: [] };
    }

    const payload = createIncidentNotificationPayload(incident, organizationId, type);
    console.log(`[Broadcast] Initiating ${type} notifications for ${allUsers.length} members`);
    console.log(`[Broadcast] War room link generated for incident ${payload.incidentId}: ${payload.warRoomLink}`);

    const results = await Promise.allSettled(
        allUsers.map((user) => sendIncidentNotifications(user, incident, type, { payload, organizationId }))
    );

    results.forEach((result, index) => {
        const userId = allUsers[index]?._id?.toString() || allUsers[index]?.id || "unknown";
        if (result.status === "fulfilled") {
            console.log(`[Broadcast] Notifications completed for user ${userId}`);
            return;
        }

        console.error(`[Broadcast] Notifications failed for user ${userId}: ${getErrorMessage(result.reason)}`);
    });

    return {
        incidentId: payload.incidentId,
        warRoomLink: payload.warRoomLink,
        users: results
    };
};

export const broadcastIncidentAlert = broadcastIncident;

export const sendIncidentNotification = async ({ incident, user, type }) => {
    if (!user) {
        console.warn("[NotificationService] No user provided. Skipping.");
        return;
    }

    await sendIncidentNotifications(user, incident, type);
};
