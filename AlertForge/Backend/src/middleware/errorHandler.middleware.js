import logger from "../utils/logger.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";

/**
 * Global Error Handler Middleware
 * Standardizes all error responses across the API.
 */
export const errorHandler = (err, req, res, next) => {
    let { statusCode, message, errorCode, details } = err;

    // Default values for unexpected errors
    if (!statusCode) statusCode = HTTP_STATUS.INTERNAL_SERVER || 500;
    if (!message) message = ERROR_MESSAGES.GENERAL.INTERNAL_SERVER || "Something went wrong";
    
    const response = {
        success: false,
        message,
        errorCode: errorCode || 'INTERNAL_ERROR',
        details: details || {},
        requestId: req.headers['x-request-id'] || 'N/A'
    };

    // Log the error using structured logger
    logger.error(message, {
        statusCode,
        errorCode,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        requestId: response.requestId
    });

    // Don't leak stack trace in production
    if (process.env.NODE_ENV !== 'production') {
        response.stack = err.stack;
    }

    return res.status(statusCode).json(response);
};
