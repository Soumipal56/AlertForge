import { Redis } from "@upstash/redis";
import appConfig from "./appConfig.js";

/**
 * PRODUCTION-READY REDIS REST CLIENT
 * 
 * Purpose: Used for stateless data caching and business logic operations.
 * Protocol: HTTPS (Stateless)
 * 
 * Note: This is separate from the Socket.IO Adapter. 
 * This client is optimized for serverless-style data access.
 */
let redis = null;

const { upstashRedisRestUrl, upstashRedisRestToken } = appConfig;

if (upstashRedisRestUrl && upstashRedisRestToken) {
    try {
        redis = new Redis({
            url: upstashRedisRestUrl,
            token: upstashRedisRestToken,
        });
        console.info("[Upstash REST] Data client initialized for caching.");
    } catch (error) {
        console.error("[Upstash REST] Failed to initialize data client:", error.message);
    }
} else {
    console.info("[Upstash REST] Credentials missing. REST caching disabled.");
}

export default redis;
