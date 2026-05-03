import { getRedisClient } from "../../config/redis.connection.js";

/**
 * DISTRIBUTED PRESENCE SERVICE
 *
 * Tracks which socket IDs are in which rooms across ALL server instances.
 *
 * 🧠 ARCHITECTURE:
 *  - Uses Redis SETs for shared, distributed presence data.
 *  - Key schema:
 *      `presence:room:<roomName>`   → SET of socketIds in that room
 *      `presence:socket:<socketId>` → SET of rooms that socket is in
 *  - Falls back to in-memory Map if Redis is unavailable (single-server safe).
 *
 * 🔁 FALLBACK:
 *  - If Redis is down, all operations use the local in-memory Map.
 *  - The app never crashes due to Redis issues.
 */

// In-memory fallback (used when Redis is unavailable)
const fallbackRooms = new Map();     // room → Set<socketId>
const fallbackSockets = new Map();   // socketId → Set<room>

// Redis key helpers
const roomKey = (room) => `presence:room:${room}`;
const socketKey = (socketId) => `presence:socket:${socketId}`;

// TTL for safety — auto-cleanup stale presence data after 24 hours
const PRESENCE_TTL_SECONDS = 86400;

// ─── FALLBACK HELPERS ──────────────────────────────────────────────────────────

const fallbackAdd = (room, socketId) => {
    if (!fallbackRooms.has(room)) fallbackRooms.set(room, new Set());
    if (!fallbackSockets.has(socketId)) fallbackSockets.set(socketId, new Set());
    fallbackRooms.get(room).add(socketId);
    fallbackSockets.get(socketId).add(room);
    return fallbackRooms.get(room).size;
};

const fallbackRemove = (room, socketId) => {
    const members = fallbackRooms.get(room);
    if (members) {
        members.delete(socketId);
        if (members.size === 0) fallbackRooms.delete(room);
    }
    const rooms = fallbackSockets.get(socketId);
    if (rooms) {
        rooms.delete(room);
        if (rooms.size === 0) fallbackSockets.delete(socketId);
    }
    return fallbackRooms.get(room)?.size ?? 0;
};

const fallbackGetCount = (room) => fallbackRooms.get(room)?.size ?? 0;

const fallbackGetRooms = (socketId) => [...(fallbackSockets.get(socketId) ?? [])];

// ─── PUBLIC API ────────────────────────────────────────────────────────────────

/**
 * Adds a socket to a room and returns the new total member count.
 * Uses Redis SADD + SCARD for distributed accuracy.
 *
 * @param {string} room
 * @param {string} socketId
 * @returns {Promise<number>} - Total member count across ALL server instances
 */
export const addUser = async (room, socketId) => {
    const redis = await getRedisClient();

    if (!redis) {
        return fallbackAdd(room, socketId);
    }

    try {
        // Add socketId to the room's SET, and room to the socket's SET (for cleanup on disconnect)
        await Promise.all([
            redis.sAdd(roomKey(room), socketId),
            redis.sAdd(socketKey(socketId), room),
            redis.expire(roomKey(room), PRESENCE_TTL_SECONDS),
            redis.expire(socketKey(socketId), PRESENCE_TTL_SECONDS),
        ]);

        // SCARD returns the exact count across all instances — this is the truth
        const count = await redis.sCard(roomKey(room));
        return count;
    } catch (err) {
        console.error("[Presence] Redis addUser failed, using fallback:", err.message);
        return fallbackAdd(room, socketId);
    }
};

/**
 * Removes a socket from a room and returns the new total member count.
 *
 * @param {string} room
 * @param {string} socketId
 * @returns {Promise<number>}
 */
export const removeUser = async (room, socketId) => {
    const redis = await getRedisClient();

    if (!redis) {
        return fallbackRemove(room, socketId);
    }

    try {
        await Promise.all([
            redis.sRem(roomKey(room), socketId),
            redis.sRem(socketKey(socketId), room),
        ]);

        const count = await redis.sCard(roomKey(room));

        // Clean up empty room key
        if (count === 0) {
            await redis.del(roomKey(room));
        }

        return count;
    } catch (err) {
        console.error("[Presence] Redis removeUser failed, using fallback:", err.message);
        return fallbackRemove(room, socketId);
    }
};

/**
 * Returns the total number of members in a room across all server instances.
 *
 * @param {string} room
 * @returns {Promise<number>}
 */
export const getCount = async (room) => {
    const redis = await getRedisClient();

    if (!redis) {
        return fallbackGetCount(room);
    }

    try {
        return await redis.sCard(roomKey(room));
    } catch (err) {
        console.error("[Presence] Redis getCount failed, using fallback:", err.message);
        return fallbackGetCount(room);
    }
};

/**
 * Returns all rooms a socket is currently in.
 * Used on disconnect to clean up presence from all rooms.
 *
 * @param {string} socketId
 * @returns {Promise<string[]>}
 */
export const getRoomsForSocket = async (socketId) => {
    const redis = await getRedisClient();

    if (!redis) {
        return fallbackGetRooms(socketId);
    }

    try {
        const rooms = await redis.sMembers(socketKey(socketId));

        // Clean up the socket's room-tracking key
        await redis.del(socketKey(socketId));

        return rooms;
    } catch (err) {
        console.error("[Presence] Redis getRoomsForSocket failed, using fallback:", err.message);
        return fallbackGetRooms(socketId);
    }
};
