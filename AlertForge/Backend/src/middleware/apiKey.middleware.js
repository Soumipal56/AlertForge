/**  
 * @description Middleware to validate API key for incoming requests
 * @returns {function} Middleware function to validate API key
 * 
 */
export const validateApiKey = (req, res, next) => {
    //!NOTE- for now it will aotomatically pass with a default key for testing purposes. In production, this should check against a secure store of API keys.
    const apiKey = req.headers["x-api-key"] || "test_key"; // Default for testing purposes

    if (!apiKey || apiKey !== "test_key") {
        return res.status(401).json({ message: "Invalid API Key" });
    }

    next();
};