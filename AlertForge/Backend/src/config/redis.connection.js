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
                const delay = Math.min(times * 100, 3000);
                return delay;
            },
            maxRetriesPerRequest: null,
            enableReadyCheck: true,
            connectTimeout: 10000,
            keepAlive: 10000, // Keep connection alive (Upstash timeout fix)
            reconnectOnError: (err) => {
                const targetError = "READONLY";
                if (err.message.includes(targetError) || err.message.includes("ECONNRESET")) {
                    return true; // Reconnect on these errors
                }
                return false;
            }
        });

        redisClient.on("error", (err) => {
            if (err.message.includes("ECONNRESET")) {
                console.warn("[Redis Shared] Connection reset by peer. Reconnecting...");
            } else {
                console.error("[Redis Shared] Error:", err.message);
            }
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
