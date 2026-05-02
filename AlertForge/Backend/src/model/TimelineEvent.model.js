import mongoose from "mongoose";
import { TIMELINE_EVENTS } from "../utils/timeline.constants.js";


/**
 * Stores a durable incident timeline entry so the activity feed can survive
 * page refreshes and server restarts.
 */
const timelineEventSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: Object.values(TIMELINE_EVENTS),
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
        metadata: {
            type: Object,
            default: {},
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        authorName: {
            type: String,
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Index for performance when fetching activity feed for an incident
timelineEventSchema.index({ incidentId: 1, createdAt: -1 });

const timelineEventModel = mongoose.model("TimelineEvent", timelineEventSchema);


export default timelineEventModel;
