import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/token.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";
import { findActiveApiKeyByUserDAO, findActiveApiKeyByHashedKeyDAO } from "../dao/apikey.dao.js";
import { hashKey } from "../utils/hashKey.js";

export const smartAuth = async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken;
        const apiKeyHeader = req.headers["x-api-key"];

        // Debug Logs (Temporary)
        console.log("Auth Attempt - Cookies:", !!accessToken, "| API Key Header:", !!apiKeyHeader);

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
            req.apiKeyId = apiKey._id;
            req.user = apiKey.user; // important for compatibility
            
            console.log("Authenticated via API Key:", req.apiKeyId);
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

            // attach user info
            req.user = { userId: decoded.userId };

            // attach API key for internal scoping usage
            const apiKey = await findActiveApiKeyByUserDAO(decoded.userId);
            req.apiKey = apiKey;
            req.apiKeyId = apiKey?._id || null;

            console.log("Authenticated via Cookie. User:", req.user.userId);
            return next();
        }

        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            "Unauthorized access - No valid session or API Key found"
        );

    } catch (error) {
        next(error);
    }
};