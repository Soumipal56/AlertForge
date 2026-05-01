import { createWarRoomMessageDAO, getRecentWarRoomMessagesDAO } from "../../dao/warRoomMessage.dao.js";

/**
 * Resolves the canonical room id from the authenticated API key.
 * We prefer service name first because it gives a stable shared room,
 * then fall back to the API key name or id if needed.
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
 * Builds a safe sender payload from the API key metadata.
 * This is what gets stored alongside each chat message.
 * @param {Object} apiKey
 * @returns {{ apiKeyId: string, name: string, serviceName: string }}
 */
export const buildWarRoomSender = (apiKey = {}) => ({
    apiKeyId: typeof apiKey.id === "string" ? apiKey.id : "",
    name: typeof apiKey.name === "string" && apiKey.name.trim() ? apiKey.name.trim() : "Unknown",
    serviceName: typeof apiKey.serviceName === "string" ? apiKey.serviceName.trim() : "",
});

/**
 * Persists a War Room message before it is broadcast to connected clients.
 * @param {{ roomId: string, content: string, apiKey: Object }} params
 * @returns {Promise<Object>}
 */
export const saveWarRoomMessage = async ({ roomId, content, apiKey }) => {
    return await createWarRoomMessageDAO({
        roomId,
        content: content.trim(),
        sender: buildWarRoomSender(apiKey),
    });
};

/**
 * Loads recent messages for a room so the UI can show chat history on join.
 * @param {string} roomId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const getRecentWarRoomMessages = async (roomId, limit = 50) => {
    return await getRecentWarRoomMessagesDAO(roomId, limit);
};
