import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import appConfig from "./appConfig.js";

/**
 * Configures the Socket.IO Redis adapter for multi-server scaling.
 * 
 * 🧠 ARCHITECTURE DESIGN:
 * 1. RESP Protocol (TCP/SSL): Required for Socket.IO Pub/Sub. URLs must start with 'redis://' or 'rediss://'.
 * 2. REST API (HTTPS): Used for standard data caching (via @upstash/redis). Incompatible with Socket.IO adapter.
 * 3. Safe Fallback: If Redis is missing, invalid, or fails, the app remains in stable single-server mode.
 * 
 * @param {import("socket.io").Server} io - The Socket.IO server instance.
 * @returns {Promise<void>}
 */
export const setupRedisAdapter = async (io) => {
    const { redisUrl } = appConfig;

    // RULE 1: Detect and ignore REST URLs for the Socket.IO adapter
    if (redisUrl && redisUrl.startsWith("https://")) {
        console.warn("[Redis] Socket.IO Adapter: REST URL detected. Skipping adapter (needs rediss://).");
        console.info("[Redis] Running in single-server mode.");
        return;
    }

    // RULE 2: Ensure we only attempt connection for valid Redis/RESP protocols
    const isValidProtocol = redisUrl && (redisUrl.startsWith("redis://") || redisUrl.startsWith("rediss://"));
    
    if (!isValidProtocol) {
        console.info("[Redis] No valid RESP URL found. Running in single-server mode.");
        return;
    }

    try {
        console.log("[Redis] Attempting to connect to Redis Adapter...");

        // Note: Pub/Sub requires the RESP protocol because it maintains a long-lived 
        // TCP connection to "listen" for broadcasts, which stateless HTTPS cannot do.
        const pubClient = createClient({ 
            url: redisUrl,
            socket: {
                tls: redisUrl.startsWith("rediss"),
                reconnectStrategy: (retries) => Math.min(retries * 50, 2000)
            }
        });
        
        const subClient = pubClient.duplicate();

        pubClient.on("error", (err) => console.error("[Redis] PubClient Error:", err.message));
        subClient.on("error", (err) => console.error("[Redis] SubClient Error:", err.message));

        await Promise.all([
            pubClient.connect(),
            subClient.connect()
        ]);

        io.adapter(createAdapter(pubClient, subClient));
        
        console.log("[Redis] Adapter attached successfully. Multi-server scaling enabled.");
    } catch (error) {
        // RULE 3: Never crash the app due to Redis issues
        console.error("[Redis] Failed to initialize adapter:", error.message);
        console.log("[Redis] Falling back to stable single-server mode.");
    }
};
