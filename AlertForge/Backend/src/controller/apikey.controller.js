// FEATURE-7: API Key Management Controller — list and revoke
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../config/constants.js";
import { generateApiKey } from "../utils/generateApiKey.js";
import { hashKey, extractKeyId } from "../utils/hashKey.js";
import { createApiKeyService, listApiKeysService, revokeApiKeyService } from "../services/apikey.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";

/**
 * POST /api/apikeys
 * Creates a new API key. Returns the raw key ONCE — not stored in plaintext.
 */
export const createApiKey = asyncHandler(async (req, res) => {
    const { name } = req.body || {};
    const userId = req.user.id;
    
    const rawKey = generateApiKey();
    const keyId = extractKeyId(rawKey);
    const hashedKey = await hashKey(rawKey);
    
    const apiKeyName = typeof name === "string" ? name.trim() : "Default Key";

    if (!userId) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authentication required", 'UNAUTHORIZED');
    }

    await createApiKeyService({
        keyId,
        hashedKey,
        name: apiKeyName,
        serviceName: apiKeyName,
        isActive: true,
        user: userId,
    });

    logger.info(`New API Key created for user ${userId} with keyId: ${keyId}`);

    return res.status(HTTP_STATUS.CREATED).json(
        new ApiResponse(
            HTTP_STATUS.CREATED,
            "API key created successfully. Save this key — it will not be shown again.",
            { key: rawKey }
        )
    );
});

/**
 * GET /api/apikeys
 * Lists all API keys for the authenticated user (hashed key excluded).
 */
export const listApiKeys = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const keys = await listApiKeysService(userId);
    return res.json(new ApiResponse(HTTP_STATUS.OK, "API keys fetched", keys));
});

/**
 * DELETE /api/apikeys/:id
 * Deactivates (revokes) an API key by ID.
 * Validates ownership before deactivating.
 */
export const revokeApiKey = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    await revokeApiKeyService(req.params.id, userId);
    
    logger.info(`API Key revoked by user ${userId} for keyId: ${req.params.id}`);
    
    return res.json(new ApiResponse(HTTP_STATUS.OK, "API key revoked"));
});
