import mongoose from "mongoose";

// FEATURE-8/10: User model with RBAC roles and team membership
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
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    avatar: {
        type: String,
        default: null,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    // FEATURE-10: RBAC — admin creates org, responder handles incidents, viewer is read-only
    role: {
        type: String,
        enum: ["admin", "responder", "viewer"],
        default: "admin",
    },
    // The owning admin's userId — for multi-tenant team scoping
    // Admin's own userId will match _id; team members will have the admin's id here
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
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

