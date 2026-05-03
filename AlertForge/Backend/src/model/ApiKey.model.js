import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const apiKeySchema = new mongoose.Schema({
    // Searchable prefix (public/non-sensitive)
    keyId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    // Securely hashed secret (private/sensitive)
    hashedKey: {
        type: String,
        required: true,
        select: false,
    },

    name: {
        type: String,
        trim: true,
    },

    serviceName: {
        type: String,
        trim: true,
    },

    isActive: {
        type: Boolean,
        default: true,
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    }

}, {
    timestamps: true
});

// PASSWORD-LIKE VERIFICATION
apiKeySchema.methods.compareKey = async function (rawKey) {
    return await bcrypt.compare(rawKey, this.hashedKey);
};

apiKeySchema.index(
    { user: 1, isActive: 1 },
    {
        unique: true,
        partialFilterExpression: { isActive: true },
    }
);

const apiKeyModel = mongoose.model("ApiKey", apiKeySchema);

export default apiKeyModel;
