import { getRedisClient } from "../../config/redis.connection.js";

/**
 * TOKEN BLACKLIST SERVICE
 * 
 * Purpose: Provides a distributed way to invalidate JWT tokens (logout).
 * Uses Redis to store blacklisted token identifiers (jti or the token itself).
 */

const BLACKLIST_PREFIX = "bl:token:";

/**
 * Blacklists an access token until it naturally expires.
 * @param {string} token - The raw JWT or a unique identifier (jti)
 * @param {number} expiresInSeconds - How long to keep it in the blacklist (match JWT expiry)
 */
export const blacklistToken = async (token, expiresInSeconds = 900) => {
    const redis = await getRedisClient();
    if (!redis) return;

    try {
        const key = `${BLACKLIST_PREFIX}${token}`;
        await redis.set(key, "1", "EX", expiresInSeconds);
        console.log(`[Redis] Token blacklisted: ${token.slice(-10)}...`);
    } catch (error) {
        console.error("[Redis] Failed to blacklist token:", error.message);
    }
};

/**
 * Checks if a token is blacklisted.
 * @param {string} token 
 * @returns {Promise<boolean>}
 */
export const isTokenBlacklisted = async (token) => {
    const redis = await getRedisClient();
    if (!redis) return false; // Fail open if Redis is down

    try {
        const key = `${BLACKLIST_PREFIX}${token}`;
        const exists = await redis.exists(key);
        return exists === 1;
    } catch (error) {
        console.error("[Redis] Blacklist check failed:", error.message);
        return false; // Fail open
    }
};
