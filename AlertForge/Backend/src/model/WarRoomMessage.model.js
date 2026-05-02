import mongoose from "mongoose";

/**
 * FEATURE-4: War Room message schema supporting structured types.
 * Supports: chat messages, internal notes, tasks, and file attachments.
 */
const warRoomMessageSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    // Structured type system
    type: {
        type: String,
        enum: ["message", "note", "task", "file"],
        default: "message",
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
    // FEATURE-4: Task system fields
    isCompleted: {
        type: Boolean,
        default: false,
    },
    assignedTo: {
        type: String,
        default: null,
    },
    // Visibility — false = internal note for responders only
    isPublic: {
        type: Boolean,
        default: true,
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
 * Custom validation: a message is valid if it has text OR file.
 */
warRoomMessageSchema.pre("validate", async function () {
    if (!this.content && !this.fileUrl) {
        throw new Error("Message must have either content or file attachment.");
    }
});

warRoomMessageSchema.index({ roomId: 1, createdAt: -1 });

const warRoomMessageModel = mongoose.model("WarRoomMessage", warRoomMessageSchema);

export default warRoomMessageModel;

