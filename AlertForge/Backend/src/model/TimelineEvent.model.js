import mongoose from "mongoose";

/**
 * Stores a durable incident timeline entry so the activity feed can survive
 * page refreshes and server restarts.
 */
const timelineEventSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ["incident.created", "incident.status_changed"],
        },
        incidentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Incident",
            required: true,
        },
        message: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

const timelineEventModel = mongoose.model("TimelineEvent", timelineEventSchema);

export default timelineEventModel;
