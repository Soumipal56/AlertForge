import mongoose from "mongoose";

// FEATURE-6: Service Registry - Full production schema
const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
    },
    url: {
        type: String,
        default: "",
        trim: true,
    },
    // Scoped to owner — same multi-tenant pattern as Incident
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    status: {
        type: String,
        enum: ["operational", "degraded", "outage"],
        default: "operational",
    },
    monitorType: {
        type: String,
        enum: ["http", "tcp", "uptime_robot", "manual"],
        default: "manual",
    },
    uptimePercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 100,
    },
    incidentCount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

serviceSchema.index({ userId: 1, createdAt: -1 });

const serviceModel = mongoose.model("Service", serviceSchema);

export default serviceModel;