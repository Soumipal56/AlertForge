// FEATURE-7: API Key Management Controller — list and revoke
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../config/constants.js";
import { generateApiKey } from "../utils/generateApiKey.js";
import { hashKey } from "../utils/hashKey.js";
import { createApiKeyService, listApiKeysService, revokeApiKeyService } from "../services/apikey.service.js";

/**
 * POST /api/apikeys
 * Creates a new API key. Returns the raw key ONCE — not stored in plaintext.
 */
export const createApiKey = async (req, res, next) => {
    try {
        const { name } = req.body || {};
        const userId = req.user?.userId;
        const rawKey = generateApiKey();
        const hashedKey = hashKey(rawKey);
        const apiKeyName = typeof name === "string" ? name.trim() : "";

        if (!userId) {
            throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authentication required to create an API key");
        }

        await createApiKeyService({
            key: hashedKey,
            name: apiKeyName || undefined,
            serviceName: apiKeyName || undefined,
            isActive: true,
            user: userId,
        });

        return res.status(HTTP_STATUS.CREATED).json(
            new ApiResponse(
                HTTP_STATUS.CREATED,
                "API key created successfully. Save this key — it will not be shown again.",
                { key: rawKey }
            )
        );
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/apikeys
 * Lists all API keys for the authenticated user (hashed key excluded).
 */
export const listApiKeys = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const keys = await listApiKeysService(userId);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "API keys fetched", keys));
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/apikeys/:id
 * Deactivates (revokes) an API key by ID.
 * Validates ownership before deactivating.
 */
export const revokeApiKey = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        await revokeApiKeyService(req.params.id, userId);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "API key revoked"));
    } catch (error) {
        next(error);
    }
};
