import mongoose from "mongoose";
import appConfig from "./appConfig.js";
import User from "../model/User.model.js";

const dropStaleUserIndexes = async () => {
    const indexes = await User.collection.indexes();
    const hasStaleClerkIndex = indexes.some((index) => index.name === "clerkId_1");

    if (hasStaleClerkIndex) {
        await User.collection.dropIndex("clerkId_1");
        console.log("[Database] Dropped stale users.clerkId_1 index");
    }
};

const connectDB = async () => {
    try {
        await mongoose.connect(appConfig.mongoURI);
        await dropStaleUserIndexes();
        console.log("MongoDB connected");
    } catch (error) {
        console.error("DB connection failed:", error.message);
        process.exit(1);
    }
};

export default connectDB;
