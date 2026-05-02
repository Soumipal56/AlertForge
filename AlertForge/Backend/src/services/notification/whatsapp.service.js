import twilio from "twilio";
import appConfig from "../../config/appConfig.js";
const client = twilio(
    appConfig.TWILIO_SID,
    appConfig.TWILIO_AUTH_TOKEN
);

export const sendWhatsApp = async ({ message, dynamicNumber = null }) => {
    try {
        const recipient = dynamicNumber || "whatsapp:+91XXXXXXXXXX"; // Fallback number
        await client.messages.create({
            body: `🚨 Incident: ${message}`,
            from: appConfig.TWILIO_WHATSAPP_NUMBER,
            to: recipient.startsWith("whatsapp:") ? recipient : `whatsapp:${recipient}`,
        });
    } catch (error) {
        console.error("WhatsApp failed:", error.message);
    }
};