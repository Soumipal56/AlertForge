import twilio from "twilio";
import appConfig from "../../config/appConfig.js";
const client = twilio(
    appConfig.TWILIO_SID,
    appConfig.TWILIO_AUTH_TOKEN
);

export const sendWhatsApp = async ({ message }) => {
    try {
        await client.messages.create({
            body: `🚨 Incident: ${message}`,
            from: appConfig.TWILIO_WHATSAPP_NUMBER,
            to: "whatsapp:+91XXXXXXXXXX", // your number
        });
    } catch (error) {
        console.error("WhatsApp failed:", error.message);
    }
};