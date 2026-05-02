import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/token.js";
import { ERROR_MESSAGES, HTTP_STATUS } from "../config/constants.js";
import { findActiveApiKeyByUserDAO } from "../dao/apikey.dao.js";

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

export const attachApiKey = async (req, res, next) => {
    try {
        const userId = req.user.id;

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
