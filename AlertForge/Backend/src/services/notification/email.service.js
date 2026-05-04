// import nodemailer from "nodemailer";
// import appConfig from "../../config/appConfig.js";

// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: appConfig.EMAIL_USER,
//         pass: appConfig.EMAIL_PASS,
//     },
// });

// const getTitlePrefix = (type) => {
//     if (type === "INCIDENT_CREATED") return "New Incident Alert";
//     if (type === "STATUS_UPDATED") return "Incident Status Update";
//     return "Incident Severity Update";
// };

// const fallbackPayload = (incident, type) => ({
//     type,
//     title: incident?.title || incident?.message || "N/A",
//     service: incident?.service || "N/A",
//     severity: incident?.severity || "N/A",
//     status: incident?.status || "N/A",
//     incidentId: incident?._id?.toString() || incident?.id?.toString() || "N/A",
//     warRoomLink: null
// });

// export const sendIncidentEmail = async ({ to, subject, payload, incident, type = "INCIDENT_CREATED" }) => {
//     try {
//         if (!appConfig.EMAIL_USER || !appConfig.EMAIL_PASS) {
//             throw new Error("EMAIL_USER and EMAIL_PASS are required for SMTP email notifications");
//         }

//         const notificationPayload = payload || fallbackPayload(incident, type);
//         const titlePrefix = getTitlePrefix(notificationPayload.type);
//         const emailSubject = subject || `${titlePrefix} - ${notificationPayload.service || "AlertForge"}`;

//         await transporter.sendMail({
//             from: `"AlertForge" <${appConfig.EMAIL_USER}>`,
//             to,
//             subject: emailSubject,
//             html: `
//         <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px;">
//           <h2 style="color: #d32f2f;">${titlePrefix}</h2>
//           <p><b>Title:</b> ${notificationPayload.title}</p>
//           <p><b>Service:</b> ${notificationPayload.service}</p>
//           <p><b>Severity:</b> ${notificationPayload.severity}</p>
//           <p><b>Status:</b> ${notificationPayload.status}</p>
//           <p><b>Incident ID:</b> ${notificationPayload.incidentId}</p>
//           <p><b>Join War Room:</b> <a href="${notificationPayload.warRoomLink}">${notificationPayload.warRoomLink}</a></p>
//           <hr />
//           <p style="font-size: 12px; color: #777;">AlertForge Automated System</p>
//         </div>
//       `,
//         });
//         console.log(`[Email] Incident notification sent successfully to: ${to}`);
//     } catch (error) {
//         console.error(`[Email] Failed to send incident email to ${to}:`, error.message);
//         throw error;
//     }
// };

// /**
//  * FEATURE-8: Sends an invitation email to a new team member.
//  */
// export const sendInviteEmail = async ({ to, name, temporaryPassword, invitedBy }) => {
//     try {
//         await transporter.sendMail({
//             from: `"AlertForge Team" <${appConfig.EMAIL_USER}>`,
//             to,
//             subject: "You've been invited to AlertForge!",
//             html: `
//         <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px; max-width: 600px;">
//           <h2 style="color: #1976d2;">Welcome to AlertForge, ${name}!</h2>
//           <p>You have been invited by <b>${invitedBy}</b> to join their incident response team.</p>
//           <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
//             <p style="margin: 0;"><b>Your Temporary Login Credentials:</b></p>
//             <p style="margin: 10px 0 0 0;">Email: <code>${to}</code></p>
//             <p style="margin: 5px 0 0 0;">Password: <code>${temporaryPassword}</code></p>
//           </div>
//           <p>Please log in at your earliest convenience and change your password.</p>
//           <a href="${appConfig.frontendUrl || "#"}" style="display: inline-block; background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Dashboard</a>
//           <hr style="margin-top: 30px;" />
//           <p style="font-size: 12px; color: #777;">This is an automated invitation from AlertForge.</p>
//         </div>
//       `,
//         });
//         console.log(`[Email] Invitation sent successfully to: ${to}`);
//     } catch (error) {
//         console.error(`[Email] Failed to send invitation email to ${to}:`, error.message);
//         throw error;
//     }
// };



import axios from "axios";
import appConfig from "../../config/appConfig.js";

const getTitlePrefix = (type) => {
  if (type === "INCIDENT_CREATED") return "New Incident Alert";
  if (type === "STATUS_UPDATED") return "Incident Status Update";
  return "Incident Severity Update";
};

const fallbackPayload = (incident, type) => ({
  type,
  title: incident?.title || incident?.message || "N/A",
  service: incident?.service || "N/A",
  severity: incident?.severity || "N/A",
  status: incident?.status || "N/A",
  incidentId:
    incident?._id?.toString() || incident?.id?.toString() || "N/A",
  warRoomLink: null,
});

/**
 * INCIDENT EMAIL (Brevo)
 */
export const sendIncidentEmail = async ({
  to,
  subject,
  payload,
  incident,
  type = "INCIDENT_CREATED",
}) => {
  try {
    if (!appConfig.BREVO_API_KEY || !appConfig.EMAIL_USER) {
      throw new Error("BREVO_API_KEY and EMAIL_USER are required");
    }

    const notificationPayload = payload || fallbackPayload(incident, type);
    const titlePrefix = getTitlePrefix(notificationPayload.type);
    const emailSubject =
      subject ||
      `${titlePrefix} - ${notificationPayload.service || "AlertForge"}`;

    const htmlContent = `
      <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #d32f2f;">${titlePrefix}</h2>
        <p><b>Title:</b> ${notificationPayload.title}</p>
        <p><b>Service:</b> ${notificationPayload.service}</p>
        <p><b>Severity:</b> ${notificationPayload.severity}</p>
        <p><b>Status:</b> ${notificationPayload.status}</p>
        <p><b>Incident ID:</b> ${notificationPayload.incidentId}</p>
        <p><b>Join War Room:</b> 
          <a href="${notificationPayload.warRoomLink}">
            ${notificationPayload.warRoomLink}
          </a>
        </p>
        <hr />
        <p style="font-size: 12px; color: #777;">
          AlertForge Automated System
        </p>
      </div>
    `;

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "AlertForge",
          email: appConfig.EMAIL_USER,
        },
        to: [{ email: to }],
        subject: emailSubject,
        htmlContent,
      },
      {
        headers: {
          "api-key": appConfig.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      `[Email] Incident notification sent successfully to: ${to}`,
      response.data
    );
  } catch (error) {
    console.error(
      `[Email] Failed to send incident email to ${to}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * INVITE EMAIL (Brevo)
 */
export const sendInviteEmail = async ({
  to,
  name,
  temporaryPassword,
  invitedBy,
}) => {
  try {
    if (!appConfig.BREVO_API_KEY || !appConfig.EMAIL_USER) {
      throw new Error("BREVO_API_KEY and EMAIL_USER are required");
    }

    const htmlContent = `
      <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px; max-width: 600px;">
        <h2 style="color: #1976d2;">
          Welcome to AlertForge, ${name}!
        </h2>

        <p>
          You have been invited by <b>${invitedBy}</b> 
          to join their incident response team.
        </p>

        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;">
            <b>Your Temporary Login Credentials:</b>
          </p>
          <p style="margin: 10px 0 0 0;">
            Email: <code>${to}</code>
          </p>
          <p style="margin: 5px 0 0 0;">
            Password: <code>${temporaryPassword}</code>
          </p>
        </div>

        <p>
          Please log in at your earliest convenience and change your password.
        </p>

        <a href="${appConfig.frontendUrl || "#"}"
          style="display: inline-block; background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Login to Dashboard
        </a>

        <hr style="margin-top: 30px;" />

        <p style="font-size: 12px; color: #777;">
          This is an automated invitation from AlertForge.
        </p>
      </div>
    `;

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "AlertForge Team",
          email: appConfig.EMAIL_USER,
        },
        to: [{ email: to }],
        subject: "You've been invited to AlertForge!",
        htmlContent,
      },
      {
        headers: {
          "api-key": appConfig.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      `[Email] Invitation sent successfully to: ${to}`,
      response.data
    );
  } catch (error) {
    console.error(
      `[Email] Failed to send invitation email to ${to}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};