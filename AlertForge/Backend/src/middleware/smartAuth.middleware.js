import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/token.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";
import { findActiveApiKeyByUserDAO, findActiveApiKeyByHashedKeyDAO } from "../dao/apikey.dao.js";
import { hashKey } from "../utils/hashKey.js";

export const smartAuth = async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken;
        const apiKeyHeader = req.headers["x-api-key"];

        // CASE 1: SDK / API KEY FLOW
        if (apiKeyHeader) {
            const hashedKey = hashKey(apiKeyHeader);
            const apiKey = await findActiveApiKeyByHashedKeyDAO(hashedKey);
            
            if (!apiKey) {
                throw new ApiError(
                    HTTP_STATUS.UNAUTHORIZED,
                    ERROR_MESSAGES.AUTH.INVALID_API_KEY
                );
            }

            req.apiKey = apiKey;
            req.user = apiKey.user; // important for compatibility
            return next();
        }

        // CASE 2: NORMAL LOGIN FLOW (Dashboard)
        if (accessToken) {
            const decoded = verifyAccessToken(accessToken);

            if (!decoded?.userId) {
                throw new ApiError(
                    HTTP_STATUS.UNAUTHORIZED,
                    ERROR_MESSAGES.AUTH.INVALID_TOKEN
                );
            }

            req.user = { userId: decoded.userId };

            // attach API key for internal usage
            const apiKey = await findActiveApiKeyByUserDAO(decoded.userId);
            req.apiKey = apiKey;

            return next();
        }

        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            "Authentication required"
        );

    } catch (error) {
        next(error);
    }
};