import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true,
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

apiKeySchema.index(
    { user: 1, isActive: 1 },
    {
        unique: true,
        partialFilterExpression: { isActive: true },
    }
);

const apiKeyModel = mongoose.model("ApiKey", apiKeySchema);

export default apiKeyModel;
