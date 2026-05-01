import mongoose from "mongoose";

const webhookLogSchema = new mongoose.Schema({
    payload: Object,

    status: {
        type: String,
        default: "received"
    },

    source: String

}, {
    timestamps: true
});

const webhookLogModel = mongoose.model("WebhookLog", webhookLogSchema);

export default webhookLogModel;