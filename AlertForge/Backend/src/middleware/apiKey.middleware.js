import ApiError from "../utils/ApiError.js";

/**  
 * @description Middleware to validate API key for incoming requests
 * @returns {function} Middleware function to validate API key
 * 
 */
export const validateApiKey = (req, res, next) => {
    //!NOTE- for now it will aotomatically pass with a default key for testing purposes. In production, this should check against a secure store of API keys.
    const apiKey = req.headers["x-api-key"] || "test_key"; // Default for testing purposes
    console.log(`the value of header ${apiKey}`);

    if (!apiKey || apiKey !== "test_key") {
        return next(new ApiError(401, "Unauthorized: Invalid API Key"));
    }

    next();
};