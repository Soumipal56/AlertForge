import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import appConfig from "./appConfig.js";

/**
 * Configures the Socket.IO Redis adapter for multi-server scaling using ioredis.
 */
export const setupRedisAdapter = async (io) => {
    const { redisUrl } = appConfig;

    if (redisUrl && redisUrl.startsWith("https://")) {
        console.warn("[Redis] Socket.IO Adapter: REST URL detected. Skipping adapter.");
        return;
    }

    const isValidProtocol = redisUrl && (redisUrl.startsWith("redis://") || redisUrl.startsWith("rediss://"));
    
    if (!isValidProtocol) {
        console.info("[Redis] No valid RESP URL found. Running in single-server mode.");
        return;
    }

    try {
        console.log("[Redis] Attempting to connect to Redis Adapter using ioredis...");

        // Use the ioredis structure as requested
        const redisOptions = {
            tls: {
                rejectUnauthorized: false
            },
            retryStrategy: (times) => Math.min(times * 100, 3000),
            maxRetriesPerRequest: null,
            enableReadyCheck: true,
            connectTimeout: 10000,
            keepAlive: 10000, // Upstash timeout fix
            reconnectOnError: (err) => {
                if (err.message.includes("READONLY") || err.message.includes("ECONNRESET")) {
                    return true;
                }
                return false;
            }
        };

        const pubClient = new Redis(redisUrl, redisOptions);
        const subClient = new Redis(redisUrl, redisOptions);

        const handleRedisError = (type, err) => {
            if (err.message.includes("ECONNRESET")) {
                console.warn(`[Redis] ${type} Connection reset. Reconnecting...`);
            } else {
                console.error(`[Redis] ${type} Error:`, err.message);
            }
        };

        pubClient.on("error", (err) => handleRedisError("PubClient", err));
        subClient.on("error", (err) => handleRedisError("SubClient", err));

        // ioredis connects automatically, but we can wait for the 'ready' event if needed
        // The adapter will handle the rest.
        io.adapter(createAdapter(pubClient, subClient));
        
        console.log("[Redis] Adapter attached successfully. Multi-server scaling enabled.");
    } catch (error) {
        console.error("[Redis] Failed to initialize adapter:", error.message);
        console.log("[Redis] Falling back to stable single-server mode.");
    }
};
