import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
    },

    serviceName: {
        type: String,
        required: true,
    },

    isActive: {
        type: Boolean,
        default: true,
    }

}, {
    timestamps: true
});

const apiKeyModel = mongoose.model("ApiKey", apiKeySchema);

export default apiKeyModel;