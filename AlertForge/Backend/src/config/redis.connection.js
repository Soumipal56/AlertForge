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
                tls: redisUrl.startsWith("rediss") ? {
                    rejectUnauthorized: false // Critical for some cloud environments
                } : false,
                reconnectStrategy: (retries) => {
                    // Start fast, then slow down up to 10 seconds between attempts
                    return Math.min(retries * 200, 10000);
                },
                connectTimeoutMs: 20000, // 20 seconds for slow cold-starts
                keepAlive: 30000, // TCP keep-alive
            },
            pingInterval: 30000 // Send a PING every 30 seconds to stay alive
        });

        redisClient.on("error", (err) => {
            console.error("[Redis Shared] Error:", err.message);
            if (err.message.includes("ECONNRESET") || err.message.includes("timeout")) {
                console.info("[Redis Shared] Network blip detected. Reconnect logic is active.");
            }
        });
        
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
