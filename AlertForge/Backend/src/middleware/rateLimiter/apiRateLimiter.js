import { rateLimit } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { getRedisClient } from "../../config/redis.connection.js";
import { rateLimitConfig } from "./config.js";

/**
 * DISTRIBUTED API RATE LIMITER
 * 
 * Uses express-rate-limit + rate-limit-redis to enforce limits across 
 * multiple backend instances.
 */

// We initialize the store once
const redis = await getRedisClient();

const store = redis ? new RedisStore({
    sendCommand: (...args) => redis.sendCommand(args),
    prefix: "rl:api:", // Unique prefix for API rate limits
}) : undefined; // Fallback to memory store if Redis is unavailable

/**
 * Public Routes Limiter (IP Based)
 */
export const publicApiLimiter = rateLimit({
    ...rateLimitConfig.api.public,
    store,
    keyGenerator: (req) => req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
});

/**
 * Authenticated Routes Limiter (API Key Based)
 */
export const authApiLimiter = rateLimit({
    ...rateLimitConfig.api.auth,
    store,
    keyGenerator: (req) => {
        // Use the API key ID provided by the validation middleware
        return req.apiKey?.id || req.headers["x-api-key"] || req.ip;
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
});

/**
 * Critical Operations Limiter (Strict Burst Protection)
 */
export const criticalApiLimiter = rateLimit({
    ...rateLimitConfig.api.critical,
    store,
    keyGenerator: (req) => req.apiKey?.id || req.ip,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
});

/**
 * Heavy Operations Limiter (Uploads, Bulk Processing)
 */
export const heavyApiLimiter = rateLimit({
    ...rateLimitConfig.api.heavy,
    store,
    keyGenerator: (req) => req.apiKey?.id || req.ip,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
});
