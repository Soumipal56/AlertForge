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
        required: true,
        trim: true,
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

warRoomMessageSchema.index({ roomId: 1, createdAt: -1 });

const warRoomMessageModel = mongoose.model("WarRoomMessage", warRoomMessageSchema);

export default warRoomMessageModel;
