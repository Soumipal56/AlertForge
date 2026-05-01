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
    }

}, {
    timestamps: true
});

const apiKeyModel = mongoose.model("ApiKey", apiKeySchema);

export default apiKeyModel;
