import mongoose from "mongoose";
import { INCIDENT_STATUS, SEVERITY } from "../config/constants.js";


/**  
 * @typedef {Object} Incident
 * @property {string} message - Description of the incident
 * @property {string} service - Affected service or component
 * @property {string} severity - Severity level (low, medium, high)
 * @property {string} status - Current status of the incident (open, investigating, identified, monitoring, resolved)
 * @property {Date} createdAt - Timestamp when the incident was created
 * @property {Date} updatedAt - Timestamp when the incident was last updated
 * @description Mongoose schema and model for an Incident in the AlertForge system
 */
const incidentSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
    },
    service: {
        type: String,
        required: true,
    },
    severity: {
        type: String,
        enum: Object.values(SEVERITY),
        default: SEVERITY.MEDIUM,
    },
    status: {
        type: String,
        enum: Object.values(INCIDENT_STATUS),
        default: INCIDENT_STATUS.OPEN,
    },
    impact: {
        type: String, // "payments failed", "500 users affected"
    },

    resolvedAt: {
        type: Date,
    },

    // metadata for AI
    metadata: {
        type: Object, // webhook payload / logs
    },
    realWorldInsights: {
        type: String,
        default: "",
    },
    /**
     * Ownership ID (API Key reference).
     * This is the primary field for authorization. 
     * We enforce that an incident can only be accessed by the key that created it.
     */
    apiKeyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ApiKey",
        required: true,
        index: true,
    }
}, {
    timestamps: true
});

const incidentModel = mongoose.model("Incident", incidentSchema);

export default incidentModel;
