import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";

/**  
 * @description Middleware to validate API key in request headers
 * @param {Object} req - Express request object containing headers
 * @param {Object} res - Express response object used to send the API response
 * @param {Function} next - Express next function for error handling
 * @returns {Object} If API key is valid, calls next() to proceed to the next middleware or route handler. If invalid, returns an error response with status code 401.
 */
export const validateApiKey = (req, res, next) => {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey || apiKey !== "test_key") {
        return next(
            new ApiError(
                HTTP_STATUS.UNAUTHORIZED,
                ERROR_MESSAGES.AUTH.INVALID_API_KEY
            )
        );
    }

    next();
};