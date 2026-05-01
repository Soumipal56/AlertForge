import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    description: String,

    status: {
        type: String,
        default: "operational"
    }

}, {
    timestamps: true
});

const serviceModel = mongoose.model("Service", serviceSchema);

export default serviceModel;