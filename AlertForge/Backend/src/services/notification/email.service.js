import nodemailer from "nodemailer";
import appConfig from "../../config/appConfig.js";


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: appConfig.EMAIL_USER,
    pass: appConfig.EMAIL_PASS,
  },
});

export const sendIncidentEmail = async ({ to, subject, message }) => {
  try {
    await transporter.sendMail({
      from: `"AlertForge" <${appConfig.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <h2>🚨 Incident Alert</h2>
        <p><b>Message:</b> ${message}</p>
      `,
    });
    console.log(`[Email] Notification sent successfully to: ${to}`);
  } catch (error) {
    console.error(`[Email] Failed to send email to ${to}:`, error.message);
  }
};