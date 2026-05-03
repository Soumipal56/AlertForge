export const sendWebhookNotification = async (data, dynamicUrl = null, type = "INCIDENT_CREATED") => {
    const webhookUrl = dynamicUrl || process.env.WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
        const titleText = type === "INCIDENT_CREATED" ? "🚨 New Incident Created" : 
                          type === "STATUS_UPDATED" ? "🔄 Incident Status Update" : 
                          "⚠️ Incident Severity Update";

        const payload = {
            embeds: [{
                title: titleText,
                color: type === "INCIDENT_CREATED" ? 0xFF0000 : (type === "STATUS_UPDATED" ? 0x00FF00 : 0xFFA500),
                fields: [
                    { name: "📌 Service",     value: data.service || "N/A",     inline: true },
                    { name: "⚡ Status",      value: data.status || "N/A",      inline: true },
                    { name: "🔴 Severity",    value: data.severity || "N/A",    inline: true },
                    { name: "📝 Title",       value: data.title || data.message || "N/A", inline: false },

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
