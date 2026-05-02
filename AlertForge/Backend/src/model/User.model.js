import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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
    name: {
        type: String,
        trim: true,
    },
    teamEmails: [
        {
            type: String,
            lowercase: true,
            trim: true,
        }
    ],
    telegramChatId: {
        type: String,
        default: null,
    },
    telegramChatIds: [
        {
            type: String,
            trim: true,
        }
    ],
    discordWebhookUrl: {
        type: String,
        default: null,
    },
    discordWebhookUrls: [
        {
            type: String,
            trim: true,
        }
    ],
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
    },
    notificationSettings: {
        emailEnabled: { type: Boolean, default: true },
        discordEnabled: { type: Boolean, default: false },
        telegramEnabled: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

const userModel = mongoose.model("User", userSchema);

export default userModel;
