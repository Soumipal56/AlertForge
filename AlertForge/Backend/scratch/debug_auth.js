import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const hashKey = (key) => {
    return crypto.createHash("sha256").update(key).digest("hex");
};

async function debugAuth() {
    const MONGO_URI = "mongodb+srv://ritammaty2006_db_user:SHshDAgn84mzp9CO@cluster0.lern1qf.mongodb.net/codeBlooded";
    const rawKey = "af_12aad9d1fe417ba04a7da1f05957c120de2ec6e4ca2e9961aceb109afad8230c";
    const hashedKey = hashKey(rawKey);
    const incidentId = "69f68996ca8624e977b60212";

    try {
        await mongoose.connect(MONGO_URI);
        
        const ApiKey = mongoose.model('ApiKey', new mongoose.Schema({
            key: String,
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }), 'apikeys');

        const User = mongoose.model('User', new mongoose.Schema({
            organizationId: mongoose.Schema.Types.ObjectId
        }), 'users');

        const Incident = mongoose.model('Incident', new mongoose.Schema({
            organizationId: mongoose.Schema.Types.ObjectId
        }), 'incidents');

        const apiKey = await ApiKey.findOne({ key: hashedKey }).populate('user');
        const incident = await Incident.findById(incidentId);

        if (!apiKey) {
            console.log("API Key not found.");
            return;
        }

        if (!incident) {
            console.log("Incident not found.");
            return;
        }

        console.log("API Key User Organization ID:", apiKey.user.organizationId);
        console.log("Incident Organization ID:", incident.organizationId);

        if (apiKey.user.organizationId.toString() === incident.organizationId.toString()) {
            console.log("✅ Organization IDs match!");
        } else {
            console.log("❌ Organization IDs do NOT match.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

debugAuth();
