import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";
import { generateApiKey } from "../utils/generateApiKey.js";
import { hashKey } from "../utils/hashKey.js";
import { createApiKeyService } from "../services/apikey.service.js";

export const createApiKey = async (req, res, next) => {
    try {
        const { name } = req.body || {};
        const rawKey = generateApiKey();
        const hashedKey = hashKey(rawKey);
        const apiKeyName = typeof name === "string" ? name.trim() : "";

        await createApiKeyService({
            key: hashedKey,
            name: apiKeyName || undefined,
            serviceName: apiKeyName || undefined,
            isActive: true,
        });

        return res.status(HTTP_STATUS.CREATED).json(
            new ApiResponse(
                HTTP_STATUS.CREATED,
                "API key created successfully",
                {
                    key: rawKey,
                }
            )
        );
    } catch (error) {
        next(error);
    }
};
