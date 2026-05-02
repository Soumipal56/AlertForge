// FEATURE-7: API Key Management Service Layer
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../config/constants.js";
import {
    createApiKeyDAO,
    findApiKeysByUserDAO,
    deactivateApiKeyByIdDAO,
} from "../dao/apikey.dao.js";

/**
 * Creates and persists a new API key record (hashed key stored, raw shown once).
 * Input: { key, name, serviceName, isActive, user }
 */
export const createApiKeyService = async (data) => {
    return await createApiKeyDAO(data);
};

/**
 * Returns all API keys for the authenticated user.
 * Keys are returned with masked values for security (show-once logic enforced at creation).
 */
export const listApiKeysService = async (userId) => {
    return await findApiKeysByUserDAO(userId);
};


/**
 * Deactivates (soft-deletes) an API key owned by the user.
 * Throws 404 if key not found or not owned by user.
 */
export const revokeApiKeyService = async (keyId, userId) => {
    const result = await deactivateApiKeyByIdDAO(keyId, userId);
    if (!result) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "API key not found");
    }
    return result;
};
