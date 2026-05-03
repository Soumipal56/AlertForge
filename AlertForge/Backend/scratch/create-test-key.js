import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateApiKey } from '../src/utils/generateApiKey.js';
import { hashKey } from '../src/utils/hashKey.js';
import { createApiKeyService } from '../src/services/apikey.service.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const TEST_USER_ID = "66144e5657a708e1847c1a84"; // I'll try to find a valid user ID first

async function createKey() {
  try {
    await mongoose.connect(MONGO_URI);
    
    // Find any user to attach the key to
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne();
    
    if (!user) {
      console.error("No user found in database. Create a user first.");
      process.exit(1);
    }
    
    console.log(`Creating API key for user: ${user.clerkId} (${user._id})`);
    
    const rawKey = generateApiKey();
    const hashedKey = hashKey(rawKey);
    
    const ApiKey = mongoose.models.ApiKey || mongoose.model('ApiKey', new mongoose.Schema({}, { strict: false }));
    
    // Deactivate existing keys for this user
    await ApiKey.updateMany({ user: user._id, isActive: true }, { isActive: false });
    console.log("Deactivated existing keys for this user.");

    await ApiKey.create({
      key: hashedKey,
      name: "Socket Test Key",
      serviceName: "Socket Test",
      isActive: true,
      user: user._id,
      createdAt: new Date(),
    });
    
    console.log("\n✅ API KEY CREATED SUCCESSFULLY");
    console.log("-----------------------------------");
    console.log(`RAW KEY: ${rawKey}`);
    console.log("-----------------------------------");
    console.log("Copy this key and put it in scratch/test-socket.js");
    
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error creating test key:", error);
  }
}

createKey();
