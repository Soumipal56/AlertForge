import appConfig from "../../config/appConfig.js";

const getTitlePrefix = (type) => {
    if (type === "INCIDENT_CREATED") return "New Incident Created";
    if (type === "STATUS_UPDATED") return "Incident Status Update";
    return "Incident Severity Update";
};

const fallbackPayload = (incident, type, link) => ({
    type,
    title: incident?.title || incident?.message || "N/A",
    service: incident?.service || "N/A",
    severity: incident?.severity || "N/A",
    status: incident?.status || "N/A",
    incidentId: incident?._id?.toString() || incident?.id?.toString() || "N/A",
    warRoomLink: link
});

export const sendTelegramNotification = async (params, legacyChatId = null, legacyLink = null, legacyType = "INCIDENT_CREATED") => {
    const botToken = appConfig.TELEGRAM_BOT_TOKEN;
    const chatId = params?.chatId || legacyChatId || appConfig.TELEGRAM_CHAT_ID;
    const payload = params?.payload || fallbackPayload(params, legacyType, legacyLink);

    if (!botToken || botToken === "your_telegram_bot_token_here") {
        throw new Error("TELEGRAM_BOT_TOKEN is required for Telegram notifications");
    }

    if (!chatId) {
        throw new Error("Telegram chat ID is required for Telegram notifications");
    }

    try {
        const message = `
*${getTitlePrefix(payload.type)}*
*Title:* ${payload.title}
*Service:* ${payload.service}
*Severity:* ${payload.severity}
*Status:* ${payload.status}
*Incident ID:* ${payload.incidentId}

*Join War Room:* ${payload.warRoomLink}

_AlertForge Incident Management_
`.trim();

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "Markdown"
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.description || `Telegram API failed with status ${response.status}`);
        }

        console.log(`[Telegram] Notification sent successfully to: ${chatId}`);
    } catch (error) {
        console.error(`[Telegram] Failed to send notification to ${chatId}:`, error.message);
        throw error;
    }
};
