import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    password: {
        type: String,
        select: false,
    },
    telegramChatId: {
        type: String,
        default: null,
    },
    discordWebhookUrl: {
        type: String,
        default: null,
    },
    whatsappNumber: {
        type: String,
        default: null,
    },
    emailAddress: {
        type: String,
        default: null,
    },
    preferences: {
        emailEnabled: { type: Boolean, default: true },
        telegramEnabled: { type: Boolean, default: false },
        webhookEnabled: { type: Boolean, default: false },
        whatsappEnabled: { type: Boolean, default: false },
    }
}, {
    timestamps: true
});

const userModel = mongoose.model("User", userSchema);

export default userModel;
