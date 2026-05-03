import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
dotenv.config();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function checkPresence() {
  try {
    const room = "socket test";
    const key = `presence:room:${room}`;
    const members = await redis.smembers(key);
    console.log(`Members in room "${room}":`, members);
    
    if (members.length > 0) {
      console.log("✅ DATA IS PRESENT IN UPSTASH!");
    } else {
      console.log("❌ Room is empty in Upstash.");
    }
  } catch (error) {
    console.error("Error checking Upstash:", error);
  }
}

checkPresence();
