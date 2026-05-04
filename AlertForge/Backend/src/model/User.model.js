import mongoose from "mongoose";

import bcrypt from "bcryptjs";

// FEATURE-8/10: User model with RBAC roles and team membership
const userSchema = new mongoose.Schema({
    // ... existing fields ...
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
    role: {
        type: String,
        enum: ["admin", "responder", "viewer"],
        default: "admin",
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
    },
    teamEmails: {
        type: [String],
        default: [],
    },
    telegramChatId: {
        type: String,
        default: null
    },
    discordWebhookUrl: {
        type: String,
        default: null,
    },
    notificationSettings: {
        emailEnabled: { type: Boolean, default: true },
        telegramEnabled: { type: Boolean, default: false },
        discordEnabled: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

// PASSWORD HASHING
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// PASSWORD VERIFICATION
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const userModel = mongoose.model("User", userSchema);
export default userModel;

