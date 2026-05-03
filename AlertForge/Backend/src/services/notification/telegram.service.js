import appConfig from "../../config/appConfig.js";

/**
 * Sends an incident notification to Telegram.
 * @param {Object} data - The incident data.
 * @param {string} [dynamicChatId] - Optional dynamic chat ID for the recipient.
 * @returns {Promise<void>}
 */
export const sendTelegramNotification = async (data, dynamicChatId = null, link = null, type = "INCIDENT_CREATED") => {
    const botToken = appConfig.TELEGRAM_BOT_TOKEN;
    const chatId = dynamicChatId || appConfig.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId || botToken === "your_telegram_bot_token_here") {
        return;
    }

    try {
        const titlePrefix = type === "INCIDENT_CREATED" ? "🚨 *New Incident Created*" : 
                            type === "STATUS_UPDATED" ? "🔄 *Incident Status Update*" : 
                            "⚠️ *Incident Severity Update*";

        let message = `
🚨 *INCIDENT ALERT* 🚨
*Title:* ${data.title || data.message || "N/A"}
*Service:* ${data.service || "N/A"}
*Severity:* ${data.severity || "N/A"}
*Status:* ${data.status || "N/A"}
*Incident ID:* ${data._id || data.id || "N/A"}
${titlePrefix}

📌 *Service:* ${data.service || "N/A"}
⚡ *Status:* ${data.status || "N/A"}
🔴 *Severity:* ${data.severity || "N/A"}
📝 *Title:* ${data.title || data.message || "N/A"}
`.trim();

        if (link) {
            message += `\n\n🔗 *Join War Room:* ${link}`;
        }

        message += `\n\n_AlertForge Incident Management_`;

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Telegram notification failed: ${errorData.description}`);
        } else {
            console.log(`[Telegram] Notification sent successfully to: ${chatId}`);
        }
    } catch (error) {
        console.error("Error sending Telegram notification:", error);
    }
};
