import { createWarRoomMessageDAO, getRecentWarRoomMessagesDAO } from "../../dao/warRoomMessage.dao.js";
import redis from "../../config/redis.client.js";
import { storeChatInPinecone } from "../ai/utils/pinecone.js";

// ----- Redis cache helpers -----
const CHAT_RECENT_CACHE_KEY = (roomId, limit) => `chat:recent:${roomId}:${limit}`;
const RECENT_CHAT_TTL_SECONDS = 300; // 5 minutes
const MAX_MESSAGE_LENGTH = 500; // characters
// --------------------------------

/**
 * Normalizes the room id derived from the API key metadata.
 * @param {Object} apiKey
 * @returns {string}
 */
export const resolveWarRoomIdFromApiKey = (apiKey = {}) => {
    const serviceName = typeof apiKey.serviceName === "string" ? apiKey.serviceName.trim() : "";
    const keyName = typeof apiKey.name === "string" ? apiKey.name.trim() : "";
    const apiKeyId = typeof apiKey.id === "string" ? apiKey.id.trim() : "";

    return serviceName || keyName || apiKeyId;
};

/**
 * Normalizes an incident id into a dedicated room name.
 * This ensures that incident-specific rooms have a consistent prefix
 * and do not collide with service-level rooms.
 * @param {string} incidentId
 * @returns {string}
 */
export const resolveIncidentRoomId = (incidentId) => {
    const id = typeof incidentId === "string" ? incidentId.trim() : "";
    return id ? `incident:${id}`.toLowerCase() : "";
};

/**
 * Builds a safe sender snapshot for persistence and socket payloads.
 * @param {Object} apiKey
 * @param {Object} user
 * @returns {{ apiKeyId: string, name: string, serviceName: string }}
 */
export const buildSenderIdentity = (apiKey = {}, user = {}) => ({
    apiKeyId: typeof apiKey.id === "string" ? apiKey.id : "",
    name: user.name || (typeof apiKey.name === "string" && apiKey.name.trim() ? apiKey.name.trim() : "Unknown"),
    serviceName: typeof apiKey.serviceName === "string" ? apiKey.serviceName.trim() : "",
});

/**
 * Validates a chat message before we write it to MongoDB.
 * @param {unknown} content
 * @returns {{ valid: boolean, message?: string, value?: string }}
 */
export const validateMessage = (content) => {
    const value = typeof content === "string" ? content.trim() : "";

    if (!value) {
        return { valid: false, message: "Message cannot be empty" };
    }

    if (value.length > MAX_MESSAGE_LENGTH) {
        return { valid: false, message: `Message must be ${MAX_MESSAGE_LENGTH} characters or less` };
    }

    return { valid: true, value };
};

/**
 * Persists a validated war room message.
 * @param {{ roomId: string, content: string, fileUrl?: string, fileType?: string, apiKey: Object, user: Object }} params
 * @returns {Promise<Object>}
 */
export const saveMessage = async ({ roomId, content, fileUrl, fileType, apiKey, user }) => {
    // If we have a file, we don't strictly require text content.
    const validation = validateMessage(content || "");

    // Only throw if there's no file AND the content is invalid (e.g. empty).
    if (!validation.valid && !fileUrl) {
        throw new Error(validation.message);
    }

    const message = await createWarRoomMessageDAO({
        roomId,
        organizationId: user.organizationId,
        content: validation.value || "",
        fileUrl,
        fileType,
        sender: buildSenderIdentity(apiKey, user),
    });

    console.log("[DB] Chat saved successfully");

    // Invalidate recent messages cache for this room (default limit 50)
    const redisClient = redis;
    const recentCacheKey = CHAT_RECENT_CACHE_KEY(roomId, 50);
    redisClient.del(recentCacheKey).catch(err => console.error("[Redis] Cache invalidation error:", err));
    
    return message;
};

/**
 * Returns recent room messages so a reconnecting client can restore history.
 * @param {string} roomId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const getRecentMessages = async (roomId, organizationId, limit = 50) => {
    return await getRecentWarRoomMessagesDAO(roomId, organizationId, limit);
};
