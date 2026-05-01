import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";
import { hashKey } from "../utils/hashKey.js";
import { findActiveApiKeyByHashedKeyDAO } from "../dao/apikey.dao.js";

/**  
 * @description Middleware to validate API key in request headers
 * @param {Object} req - Express request object containing headers
 * @param {Object} res - Express response object used to send the API response
 * @param {Function} next - Express next function for error handling
 * @returns {Object} If API key is valid, calls next() to proceed to the next middleware or route handler. If invalid, returns an error response with status code 401.
 */
export const validateApiKey = async (req, res, next) => {
    try {
        const rawApiKey = req.get("x-api-key")?.trim();

        if (!rawApiKey) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: ERROR_MESSAGES.AUTH.INVALID_API_KEY,
            });
        }

        const hashedApiKey = hashKey(rawApiKey);
        const apiKey = await findActiveApiKeyByHashedKeyDAO(hashedApiKey);

        if (!apiKey) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: ERROR_MESSAGES.AUTH.INVALID_API_KEY,
            });
        }

        req.apiKey = apiKey;
        return next();
    } catch (error) {
        return next(error);
    }
};
