import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/token.js";
import { ERROR_MESSAGES, HTTP_STATUS } from "../config/constants.js";
import { findActiveApiKeyByUserDAO, findActiveApiKeyByHashedKeyDAO } from "../dao/apikey.dao.js";
import { hashKey } from "../utils/hashKey.js";

/**
 * @description Authentication middleware for Dashboard users (Cookies)
 */
export const authMiddleware = async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken;

        if (!accessToken) {
            throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.UNAUTHORIZED);
        }

        const decoded = verifyAccessToken(accessToken);
        if (!decoded?.userId) {
            throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.INVALID_TOKEN);
        }

        req.user = { userId: decoded.userId };

        return next();
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }

        return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.INVALID_TOKEN));
    }
};

/**
 * @description Attaches the user's active API key to the request
 */
export const attachApiKey = async (req, res, next) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.UNAUTHORIZED);
        }

        const apiKey = await findActiveApiKeyByUserDAO(userId);
        if (!apiKey) {
            throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.INVALID_API_KEY);
        }

        req.apiKey = apiKey;
        return next();
    } catch (error) {
        return next(error);
    }
};

/**
 * @description Smart middleware supporting BOTH Dashboard (Cookies) and SDK (API Key)
 */
export const dualAuthMiddleware = async (req, res, next) => {
    try {
        // 1. Try Session Auth (Cookies) - Priority for Dashboard users
        const accessToken = req.cookies?.accessToken;
        if (accessToken) {
            try {
                const decoded = verifyAccessToken(accessToken);
                if (decoded?.userId) {
                    req.user = { userId: decoded.userId };
                    const apiKey = await findActiveApiKeyByUserDAO(decoded.userId);
                    if (apiKey) {
                        req.apiKey = apiKey;
                        return next();
                    }
                }
            } catch (err) {
                // Ignore session error, try API Key instead
                console.warn("[Auth] Session invalid, trying API key...");
            }
        }

        // 2. Try SDK Auth (x-api-key header or query param)
        const apiKeyHeader = req.headers["x-api-key"] || req.query.apiKey;
        if (apiKeyHeader) {
            const hashedKey = hashKey(apiKeyHeader);
            const apiKeyDoc = await findActiveApiKeyByHashedKeyDAO(hashedKey);
            
            if (apiKeyDoc) {
                req.apiKey = apiKeyDoc;
                // Ensure req.user is set so controllers don't break
                req.user = { 
                    userId: apiKeyDoc.user?._id?.toString() || apiKeyDoc.user?.toString() 
                };
                return next();
            }
        }

        // 3. Both failed
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED, 
            "Authentication failed. Provide a valid session or 'x-api-key' header."
        );
    } catch (error) {
        next(error);
    }
};
