import mongoose from "mongoose";

const postmortemActionItemSchema = new mongoose.Schema(
    {
        task: {
            type: String,
            required: true,
            trim: true,
        },
        owner: {
            type: String,
            required: true,
            trim: true,
        },
        deadline: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "done"],
            default: "pending",
        },
    },
    { _id: false }
);

const postmortemSchema = new mongoose.Schema(
    {
        incidentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Incident",
            required: true,
            unique: true,
            index: true,
        },
        summary: {
            type: String,
            required: true,
            trim: true,
        },
        rootCause: {
            type: String,
            required: true,
            trim: true,
        },
        contributingFactors: {
            type: [String],
            default: [],
        },
        actionItems: {
            type: [postmortemActionItemSchema],
            default: [],
        },
        learnings: {
            type: String,
            required: true,
            trim: true,
        },
        debuggingTimeline: {
            type: String,
            default: "",
        },
        externalKnowledge: {
            summary: {
                type: String,
                default: "",
            },
            sources: [
                {
                    title: String,
                    url: String,
                },
            ],
        },
        aiConfidence: {
            type: Number,
            min: 0,
            max: 1,
        },
    },
    {
        timestamps: true,
    }
);

const postmortemModel = mongoose.model("Postmortem", postmortemSchema);

export default postmortemModel;
