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
            retryStrategy: (times) => Math.min(times * 50, 2000),
            maxRetriesPerRequest: null,
            enableReadyCheck: true
        };

        const pubClient = new Redis(redisUrl, redisOptions);
        const subClient = new Redis(redisUrl, redisOptions);

        pubClient.on("error", (err) => console.error("[Redis] PubClient Error:", err.message));
        subClient.on("error", (err) => console.error("[Redis] SubClient Error:", err.message));

        // ioredis connects automatically, but we can wait for the 'ready' event if needed
        // The adapter will handle the rest.
        io.adapter(createAdapter(pubClient, subClient));
        
        console.log("[Redis] Adapter attached successfully. Multi-server scaling enabled.");
    } catch (error) {
        console.error("[Redis] Failed to initialize adapter:", error.message);
        console.log("[Redis] Falling back to stable single-server mode.");
    }
};
