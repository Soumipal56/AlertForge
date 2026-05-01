import { sendIncidentEmail } from "./email.service.js";
import { sendWhatsApp } from "./whatsapp.service.js";
import { sendWebhookNotification } from "./webhook.service.js";
/**  
 * Sends an incident notification email to the specified recipient.
 * @param {Object} data - The incident data containing the message to be sent.
 * @param {string} data.message - The message describing the incident.
 * @returns {Promise<void>} A promise that resolves when the email is sent.
 */
export const sendIncidentNotification = async (data) => {
    try {
        await sendIncidentEmail({
            to: data.to || "ritammaty2005@gmail.com", // change later dynamically
            subject: "New Incident Created",
            message: data.message,
        });
        await sendWhatsApp({
            message: data.message,
        });
        await sendWebhookNotification(data);
    } catch (error) {
        console.error("Error sending incident notification:", error);
    }
};