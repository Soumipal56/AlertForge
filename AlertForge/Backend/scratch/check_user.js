import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const CLERK_ID = "user_3D9ox4XSFsl7T7KFMXZYD7I5HHi";

async function checkUserSettings() {
  try {
    await mongoose.connect(MONGO_URI);
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ clerkId: CLERK_ID });
    
    if (user) {
      console.log("User Settings Found:");
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log("User not found in database.");
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error checking user settings:", error);
  }
}

checkUserSettings();
