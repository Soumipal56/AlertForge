import { getRedisClient } from "../../config/redis.connection.js";
import { rateLimitConfig } from "./config.js";

/**
 * DISTRIBUTED SOCKET.IO RATE LIMITING
 * 
 * Custom logic to throttle real-time events across multiple instances.
 */

/**
 * Checks if a specific socket event should be throttled.
 * 
 * @param {import("socket.io").Socket} socket - The socket instance
 * @param {string} event - The event name
 * @param {Object} options - Throttling options (windowSeconds, limit)
 * @returns {Promise<boolean>} - True if allowed, false if limited
 */
export const throttleSocketEvent = async (socket, event, options) => {
    const redis = await getRedisClient();
    if (!redis) return true; // Fail open if Redis is down

    const identifier = socket.data.apiKey?.id || socket.id;
    const key = `rl:socket:${event}:${identifier}`;
    const { windowSeconds, limit } = options;

    try {
        // Increment and set TTL atomically
        const multi = redis.multi();
        multi.incr(key);
        multi.expire(key, windowSeconds, "NX"); // Only set expire if key doesn't exist
        
        const results = await multi.exec();
        const currentCount = results[0];

        if (currentCount > limit) {
            console.warn(`[Socket RateLimit] '${event}' blocked for ${identifier} (${currentCount}/${limit})`);
            
            socket.emit("error:rate_limit", {
                event,
                message: `You are sending '${event}' events too fast. Please wait a moment.`,
                retryAfter: windowSeconds
            });
            
            return false;
        }

        return true;
    } catch (error) {
        console.error(`[Socket RateLimit] Error:`, error.message);
        return true; // Fail open
    }
};

/**
 * Connection Rate Limiter Middleware
 */
export const socketConnectionLimiter = async (socket, next) => {
    const redis = await getRedisClient();
    if (!redis) return next();

    const ip = socket.handshake.address || socket.conn.remoteAddress;
    const key = `rl:socket:connection:${ip}`;
    const { windowSeconds, limit } = rateLimitConfig.socket.join; // Reusing join limits for connection

    try {
        const currentCount = await redis.incr(key);
        if (currentCount === 1) {
            await redis.expire(key, 60); // 1 minute window
        }

        if (currentCount > 15) { // Strict limit for connection spam
            return next(new Error("Connection rate limit exceeded. Please try again in a minute."));
        }

        next();
    } catch (error) {
        next();
    }
};
