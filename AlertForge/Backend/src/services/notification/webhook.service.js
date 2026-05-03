const getTitleText = (type) => {
    if (type === "INCIDENT_CREATED") return "New Incident Created";
    if (type === "STATUS_UPDATED") return "Incident Status Update";
    return "Incident Severity Update";
};

const getEmbedColor = (type) => {
    if (type === "INCIDENT_CREATED") return 0xFF0000;
    if (type === "STATUS_UPDATED") return 0x00FF00;
    return 0xFFA500;
};

const fallbackPayload = (incident, type) => ({
    type,
    title: incident?.title || incident?.message || "N/A",
    service: incident?.service || "N/A",
    severity: incident?.severity || "N/A",
    status: incident?.status || "N/A",
    incidentId: incident?._id?.toString() || incident?.id?.toString() || "N/A",
    warRoomLink: null
});

export const sendWebhookNotification = async (params, legacyWebhookUrl = null, legacyType = "INCIDENT_CREATED") => {
    const webhookUrl = params?.webhookUrl || legacyWebhookUrl || process.env.WEBHOOK_URL;
    const payload = params?.payload || fallbackPayload(params, legacyType);

    if (!webhookUrl) {
        throw new Error("Discord webhook URL is required for Discord notifications");
    }

    if (!webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
        throw new Error("Invalid Discord webhook URL");
    }

    try {
        const body = {
            embeds: [{
                title: getTitleText(payload.type),
                color: getEmbedColor(payload.type),
                fields: [
                    { name: "Title", value: payload.title, inline: false },
                    { name: "Service", value: payload.service, inline: true },
                    { name: "Severity", value: payload.severity, inline: true },
                    { name: "Status", value: payload.status, inline: true },
                    { name: "Incident ID", value: payload.incidentId, inline: false },
                    { name: "Join War Room", value: payload.warRoomLink, inline: false },
                ],
                footer: { text: "AlertForge Incident Management" },
                timestamp: new Date().toISOString()
            }]
        };

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            throw new Error(`Discord webhook failed with status ${response.status}${errorText ? `: ${errorText}` : ""}`);
        }

        console.log("[Discord] Webhook notification sent successfully");
    } catch (error) {
        console.error("[Discord] Failed to send webhook notification:", error.message);
        throw error;
    }
};
