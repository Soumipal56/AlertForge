import { createClient } from "redis";
import appConfig from "./appConfig.js";

/**
 * SHARED REDIS RESP CLIENT (TCP/SSL)
 * 
 * Used for:
 * 1. Socket.IO Redis Adapter
 * 2. Distributed Rate Limiting (Redis Store)
 * 3. High-performance Pub/Sub operations
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
        redisClient = createClient({ 
            url: redisUrl,
            socket: {
                tls: redisUrl.startsWith("rediss"),
                reconnectStrategy: (retries) => {
                    // Exponential backoff with a cap of 5 seconds
                    const delay = Math.min(retries * 100, 5000);
                    return delay;
                },
                connectTimeoutMs: 10000, // 10 seconds timeout
                keepAlive: 10000, // Keep connection alive with 10s interval
            }
        });

        redisClient.on("error", (err) => console.error("[Redis Shared] Error:", err.message));
        
        await redisClient.connect();
        console.log("[Redis Shared] Connected successfully.");
        
        return redisClient;
    } catch (error) {
        console.error("[Redis Shared] Connection failed:", error.message);
        redisClient = null;
        return null;
    }
};

export default getRedisClient;
