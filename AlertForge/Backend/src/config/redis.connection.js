import Redis from "ioredis";
import appConfig from "./appConfig.js";

/**
 * SHARED REDIS RESP CLIENT (TCP/SSL) using ioredis
 */
let redisClient = null;

export const getRedisClient = async () => {
    if (redisClient) return redisClient;

    const { redisUrl } = appConfig;

    if (!redisUrl || redisUrl.startsWith("https://")) {
        console.warn("[Redis] Valid RESP URL not found. Features requiring TCP Redis will be disabled.");
        return null;
    }

    try {
        // Using the structure you requested
        redisClient = new Redis(redisUrl, {
            tls: {
                rejectUnauthorized: false
            },
            // Additional stability options
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: null, // Keep retrying
            enableReadyCheck: true
        });

        redisClient.on("error", (err) => {
            console.error("[Redis Shared] Error:", err.message);
        });

        redisClient.on("connect", () => {
            console.log("[Redis Shared] Connected successfully.");
        });
        
        return redisClient;
    } catch (error) {
        console.error("[Redis Shared] Connection failed:", error.message);
        redisClient = null;
        return null;
    }
};

export default getRedisClient;
