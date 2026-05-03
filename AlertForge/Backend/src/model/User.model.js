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
    teamEmails: {
        type: [String],
        default: [],
        validate: {
            validator: function(emails) {
                return emails.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
            },
            message: "Invalid email format in teamEmails"
        }
    },
    telegramChatId: {
        type: String,
        default: null
    },
    discordWebhookUrl: {
        type: String,
        default: null,
        validate: {
            validator: function(url) {
                if (!url) return true;
                return url.startsWith("https://discord.com/api/webhooks/");
            },
            message: "Invalid Discord webhook URL"
        }
    },
    notificationSettings: {
        emailEnabled: {
            type: Boolean,
            default: true
        },
        telegramEnabled: {
            type: Boolean,
            default: false
        },
        discordEnabled: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

const userModel = mongoose.model("User", userSchema);

export default userModel;

