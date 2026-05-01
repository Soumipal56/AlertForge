import mongoose from "mongoose";

/**
 * Stores one chat message for a War Room.
 * The room is derived from the API key, so we keep it as a plain string
 * instead of introducing a separate user or membership model.
 */
const warRoomMessageSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    content: {
        type: String,
        default: "",
        trim: true,
    },
    fileUrl: {
        type: String,
        default: "",
        trim: true,
    },
    fileType: {
        type: String,
        enum: ["image", "pdf", null],
        default: null,
    },
    sender: {
        apiKeyId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        serviceName: {
            type: String,
            trim: true,
        },
    },
}, {
    timestamps: true,
});

/**
 * Custom validation logic:
 * A message is valid if it has either text content or a file attachment.
 * It should only fail if both are missing.
 */
warRoomMessageSchema.pre("validate", async function () {
    if (!this.content && !this.fileUrl) {
        throw new Error("Message must have either content or file attachment.");
    }
});

warRoomMessageSchema.index({ roomId: 1, createdAt: -1 });

const warRoomMessageModel = mongoose.model("WarRoomMessage", warRoomMessageSchema);

export default warRoomMessageModel;
