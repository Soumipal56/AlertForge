import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const hashKey = (key) => {
    return crypto.createHash("sha256").update(key).digest("hex");
};

async function checkKey() {
    const MONGO_URI = "mongodb+srv://ritammaty2006_db_user:SHshDAgn84mzp9CO@cluster0.lern1qf.mongodb.net/codeBlooded";
    const rawKey = "af_12aad9d1fe417ba04a7da1f05957c120de2ec6e4ca2e9961aceb109afad8230c";
    const hashedKey = hashKey(rawKey);

    console.log("Checking key:", rawKey);
    console.log("Hashed key:", hashedKey);

    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const ApiKey = mongoose.model('ApiKey', new mongoose.Schema({
            key: String,
            isActive: Boolean,
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }), 'apikeys');

        const found = await ApiKey.findOne({ key: hashedKey });
        if (found) {
            console.log("✅ Key found in database!");
            console.log("ID:", found._id);
            console.log("Is Active:", found.isActive);
            console.log("User ID:", found.user);
        } else {
            console.log("❌ Key NOT found in database.");
        }
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkKey();
