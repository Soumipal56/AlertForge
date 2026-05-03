import { sendIncidentEmail } from "./email.service.js";
import { sendWhatsApp } from "./whatsapp.service.js";
import { sendTelegramNotification } from "./telegram.service.js";
import { getTeamMembersDAO, findUserByIdDAO } from "../../dao/user.dao.js";

const formatMessage = (incident) => {
    const title = incident.title || incident.message || "N/A";
    const service = incident.service || "N/A";
    const severity = incident.severity || "N/A";
    const status = incident.status || "N/A";
    const incidentId = incident._id?.toString() || incident.id || "N/A";
    return `🚨 INCIDENT ALERT 🚨\nTitle: ${title}\nService: ${service}\nSeverity: ${severity}\nStatus: ${status}\nIncident ID: ${incidentId}`;
};

/**
 * Helper to deduplicate arrays and remove falsy values
 */
const getUniqueRecipients = (recipients) => {
    return Array.from(new Set(recipients.filter(Boolean)));
};

/**
 * Sends Email notifications to multiple recipients
 */
export const sendEmailNotifications = async (user, incident, warRoomLink) => {
    try {
        if (!user.notificationSettings?.emailEnabled) return;

        const recipients = getUniqueRecipients([
            user.email,
            user.emailAddress,
            ...(user.teamEmails || [])
        ]);

        if (recipients.length === 0) return;

        const msg = formatMessage(incident);
        const emailPromises = recipients.map(email => 
            sendIncidentEmail({
                to: email,
                subject: `🚨 INCIDENT ALERT: ${incident.service} - ${incident.severity.toUpperCase()}`,
                message: `${msg.replace(/\n/g, '<br/>')}<br/><br/>Access the War Room here:<br/><a href="${warRoomLink}">${warRoomLink}</a>`
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
export const sendTelegramNotifications = async (user, incident, warRoomLink) => {
    try {
        if (!user.notificationSettings?.telegramEnabled) return;

        const chatIds = getUniqueRecipients([
            user.telegramChatId,
            ...(user.telegramChatIds || [])
        ]);

        if (chatIds.length === 0) return;

        const telegramPromises = chatIds.map(chatId => 
            sendTelegramNotification(incident, chatId, warRoomLink)
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
export const sendDiscordNotifications = async (user, incident, warRoomLink) => {
    try {
        // ─── DEBUG LOGGING ───────────────────────────────────────────────
        console.log("[Discord] Entering sendDiscordNotifications");
        console.log("[Discord] notificationSettings:", JSON.stringify(user.notificationSettings));
        console.log("[Discord] discordWebhookUrl:", user.discordWebhookUrl);
        console.log("[Discord] discordWebhookUrls:", user.discordWebhookUrls);
        // ────────────────────────────────────────────────────────────────

        if (!user.notificationSettings?.discordEnabled) {
            console.warn("[Discord] Skipped — discordEnabled is false or missing");
            return;
        }

        const webhooks = getUniqueRecipients([
            user.discordWebhookUrl,
            ...(user.discordWebhookUrls || [])
        ]);

        console.log("[Discord] Final webhook list:", webhooks);

        if (webhooks.length === 0) {
            console.warn("[Discord] Skipped — no webhook URLs found on user");
            return;
        }

        const msg = formatMessage(incident);
        const message = `${msg}\n\nJoin War Room: ${warRoomLink}`;

        const discordPromises = webhooks.map(url =>
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message })
            }).then(res => {
                console.log(`[Discord] Response status for ${url}:`, res.status);
                if (!res.ok) throw new Error(`Status ${res.status}`);
                console.log(`[Discord] ✅ Successfully sent to ${url}`);
            })
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
export const sendIncidentNotifications = async (user, incident) => {
    const incidentId = incident._id?.toString() || incident.id;
    const warRoomLink = `http://localhost:5173/warroom/${incidentId}`;

    console.log("[Notification] Firing notifications for user:", user._id?.toString() || user.id);

    // Execute all channels in parallel
    await Promise.allSettled([
        sendEmailNotifications(user, incident, warRoomLink),
        sendTelegramNotifications(user, incident, warRoomLink),
        sendDiscordNotifications(user, incident, warRoomLink),
        // Optional Whatsapp legacy
        user.preferences?.whatsappEnabled && user.whatsappNumber ? sendWhatsApp({
            message: `${incident.title || incident.message}. Join War Room: ${warRoomLink}`,
            dynamicNumber: user.whatsappNumber
        }) : Promise.resolve()
    ]);
};

/**
 * Broadcast an incident alert to all users in an organization
 */
export const broadcastIncidentAlert = async (incident, organizationId) => {
    try {
        console.log(`[Broadcast] Fetching users for organization: ${organizationId}`);
        const [adminUser, teamMembers] = await Promise.all([
            findUserByIdDAO(organizationId),
            getTeamMembersDAO(organizationId)
        ]);

        const allUsers = [];
        if (adminUser) allUsers.push(adminUser);
        if (teamMembers && teamMembers.length > 0) allUsers.push(...teamMembers);

        if (allUsers.length === 0) {
            console.warn("[Broadcast] No users found for organization.");
            return;
        }

        console.log(`[Broadcast] Initiating notifications for ${allUsers.length} members`);
        const promises = allUsers.map(user => sendIncidentNotifications(user, incident));
        
        await Promise.allSettled(promises);
    } catch (error) {
        console.error("[Broadcast] Error broadcasting incident alert:", error);
    }
};

/**  
 * Legacy Support / Fallback
 */
export const sendIncidentNotification = async (data, userId) => {
    console.warn("sendIncidentNotification is deprecated. Use sendIncidentNotifications instead.");
};
