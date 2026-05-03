import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function findIncident() {
    const MONGO_URI = "mongodb+srv://ritammaty2006_db_user:SHshDAgn84mzp9CO@cluster0.lern1qf.mongodb.net/codeBlooded";
    try {
        await mongoose.connect(MONGO_URI);
        const Incident = mongoose.model('Incident', new mongoose.Schema({
            title: String,
            organizationId: mongoose.Schema.Types.ObjectId
        }), 'incidents');

        const incident = await Incident.findOne();
        if (incident) {
            console.log("Found Incident ID:", incident._id);
            console.log("Organization ID:", incident.organizationId);
        } else {
            console.log("No incidents found.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

findIncident();
