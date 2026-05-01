import appConfig from "../../config/appConfig.js";

/**
 * Sends an incident notification to Telegram.
 * @param {Object} data - The incident data.
 * @returns {Promise<void>}
 */
export const sendTelegramNotification = async (data) => {
    const botToken = appConfig.TELEGRAM_BOT_TOKEN;
    const chatId = appConfig.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId || botToken === "your_telegram_bot_token_here") {
        return;
    }

    try {
        const message = `
🚨 *New Incident Created*

📌 *Service:* ${data.service || "N/A"}
⚡ *Status:* ${data.status || "N/A"}
🔴 *Severity:* ${data.severity || "N/A"}
📝 *Message:* ${data.message || "N/A"}

_AlertForge Incident Management_
        `.trim();

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
        }
    } catch (error) {
        console.error("Error sending Telegram notification:", error);
    }
};
