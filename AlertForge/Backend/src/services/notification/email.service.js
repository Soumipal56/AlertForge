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
            subject: subject || "🚨 Incident Alert",
            html: `
        <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #d32f2f;">🚨 Incident Alert</h2>
          <p><b>Message:</b> ${message}</p>
          <hr />
          <p style="font-size: 12px; color: #777;">AlertForge Automated System</p>
        </div>
      `,
        });
        console.log(`[Email] Incident notification sent successfully to: ${to}`);
    } catch (error) {
        console.error(`[Email] Failed to send incident email to ${to}:`, error.message);
    }
};

/**
 * FEATURE-8: Sends an invitation email to a new team member.
 */
export const sendInviteEmail = async ({ to, name, temporaryPassword, invitedBy }) => {
    try {
        await transporter.sendMail({
            from: `"AlertForge Team" <${appConfig.EMAIL_USER}>`,
            to,
            subject: "You've been invited to AlertForge!",
            html: `
        <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px; max-width: 600px;">
          <h2 style="color: #1976d2;">Welcome to AlertForge, ${name}!</h2>
          <p>You have been invited by <b>${invitedBy}</b> to join their incident response team.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><b>Your Temporary Login Credentials:</b></p>
            <p style="margin: 10px 0 0 0;">Email: <code>${to}</code></p>
            <p style="margin: 5px 0 0 0;">Password: <code>${temporaryPassword}</code></p>
          </div>
          <p>Please log in at your earliest convenience and change your password.</p>
          <a href="${appConfig.frontendUrl || "#"}" style="display: inline-block; background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Dashboard</a>
          <hr style="margin-top: 30px;" />
          <p style="font-size: 12px; color: #777;">This is an automated invitation from AlertForge.</p>
        </div>
      `,
        });
        console.log(`[Email] Invitation sent successfully to: ${to}`);
    } catch (error) {
        console.error(`[Email] Failed to send invitation email to ${to}:`, error.message);
    }
};