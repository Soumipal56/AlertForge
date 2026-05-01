import { createWarRoomMessageDAO, getRecentWarRoomMessagesDAO } from "../../dao/warRoomMessage.dao.js";

const MAX_MESSAGE_LENGTH = 500;

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
 * @param {{ roomId: string, content: string, apiKey: Object, user: Object }} params
 * @returns {Promise<Object>}
 */
export const saveMessage = async ({ roomId, content, apiKey, user }) => {
    const validation = validateMessage(content);

    if (!validation.valid) {
        throw new Error(validation.message);
    }

    return await createWarRoomMessageDAO({
        roomId,
        content: validation.value,
        sender: buildSenderIdentity(apiKey, user),
    });
};

/**
 * Returns recent room messages so a reconnecting client can restore history.
 * @param {string} roomId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const getRecentMessages = async (roomId, limit = 50) => {
    return await getRecentWarRoomMessagesDAO(roomId, limit);
};
