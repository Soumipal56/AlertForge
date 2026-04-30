import mongoose from "mongoose";
import appConfig from "./appConfig.js";

const connectDB = async () => {
    try {
        await mongoose.connect(appConfig.mongoURI);
        console.log("MongoDB connected");
    } catch (error) {
        console.error("DB connection failed:", error.message);
        process.exit(1);
    }
};

export default connectDB;