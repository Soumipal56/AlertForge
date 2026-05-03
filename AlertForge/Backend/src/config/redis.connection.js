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
        // Fix: If URL starts with rediss://, node-redis v4+ might conflict with explicit tls options.
        // We strip the 's' and manually enable the TLS socket.
        const normalizedUrl = redisUrl.replace("rediss://", "redis://");

        redisClient = createClient({ 
            url: normalizedUrl,
            socket: {
                tls: redisUrl.startsWith("rediss"), // Manually enable TLS
                reconnectStrategy: (retries) => {
                    return Math.min(retries * 200, 10000);
                },
                connectTimeoutMs: 20000,
                keepAlive: 30000,
            },
            pingInterval: 30000
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
