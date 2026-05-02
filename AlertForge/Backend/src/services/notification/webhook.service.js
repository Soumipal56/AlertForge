export const sendWebhookNotification = async (data, dynamicUrl = null) => {
    const webhookUrl = dynamicUrl || process.env.WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
        const payload = {
            embeds: [{
                title: "🚨 New Incident Created",
                color: 0xFF0000,
                fields: [
                    { name: "📌 Service",     value: data.service || "N/A",     inline: true },
                    { name: "⚡ Status",      value: data.status || "N/A",      inline: true },
                    { name: "🔴 Severity",    value: data.severity || "N/A",    inline: true },
                    { name: "📝 Message",     value: data.message || "N/A",     inline: false },
                ],
                footer: { text: "AlertForge Incident Management" },
                timestamp: new Date().toISOString()
            }]
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error(`Webhook notification failed with status ${response.status}`);
        } else {
            console.log(`[Discord/Webhook] Notification sent successfully!`);
        }
    } catch (error) {
        console.error("Error sending webhook notification:", error);
    }
};
