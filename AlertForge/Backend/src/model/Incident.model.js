import mongoose from "mongoose";
import { INCIDENT_STATUS, SEVERITY } from "../config/constants.js";

/**  
 * Incident model — title is the canonical field since the UI migration.
 * 'message' is kept for backward compatibility with existing SDK webhooks.
 * A pre-save hook keeps both fields in sync so no consumer breaks.
 */
const incidentSchema = new mongoose.Schema({
    // CANONICAL: used by dashboard UI
    title: {
        type: String,
        required: true,
        trim: true,
    },
    // LEGACY: kept for SDK / webhook consumers — auto-synced from title
    message: {
        type: String,
        trim: true,
    },
    service: {
        type: String,
        required: true,
    },
    severity: {
        type: String,
        enum: Object.values(SEVERITY),
        default: SEVERITY.P3,
    },
    status: {
        type: String,
        enum: Object.values(INCIDENT_STATUS),
        default: INCIDENT_STATUS.INVESTIGATING,
        index: true,
    },
    startedAt: {
        type: Date,
        default: Date.now,
    },
    resolvedAt: {
        type: Date,
    },
    responders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
    metadata: {
        type: Object,
    },
    realWorldInsights: {
        type: String,
        default: "",
    },
    /**
     * Ownership ID (API Key reference) — primary scoping field.
     * Incidents are only accessible by the key that created them.
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

/**
 * Backward-compat sync: ensure title ↔ message are always both populated.
 * - If only 'title' sent (new UI):  message = title
 * - If only 'message' sent (SDK):   title = message
 */
incidentSchema.pre("save", function () {
    if (this.title && !this.message) this.message = this.title;
    if (this.message && !this.title) this.title = this.message;
});


const incidentModel = mongoose.model("Incident", incidentSchema);

export default incidentModel;

