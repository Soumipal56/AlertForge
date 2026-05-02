import mongoose from "mongoose";

/**
 * @typedef {Object} UserNotificationSettings
 * @property {string} clerkId - The unique ID from Clerk
 * @property {string} telegramChatId - The user's specific Telegram Chat ID
 * @property {string} discordWebhookUrl - The user's specific Discord/Slack Webhook URL
 * @property {Object} preferences - Toggle switches for different channels
 */
const userSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        unique: true,
        index: true,
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
