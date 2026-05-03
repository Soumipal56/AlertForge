// sdk/core/http/client.js
import axios from "axios";
import { getConfig } from "../config/index.js";
import logger from "../utils/logger.js";

/**
 * Normalized HTTP Client for AlertForge SDK.
 * Handles automatic token attachment and error wrapping.
 */
const httpClient = async (options = {}) => {
    const { baseURL, accessToken, apiKey } = getConfig();

    const headers = {
        "Content-Type": "application/json",
    };

    // Prioritize User Session (JWT) over API Key for hybrid flows
    if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
    } else if (apiKey) {
        headers["x-api-key"] = apiKey;
    }

    const instance = axios.create({
        baseURL,
        headers,
    });

    try {
        const response = await instance(options);
        return response.data;
    } catch (error) {
        const normalizedError = {
            status: error.response?.status || 500,
            message: error.response?.data?.message || error.message || "Unknown API Error",
            data: error.response?.data?.data || null,
            originalError: error,
        };

        logger.error(`[HTTP ${options.method || "GET"}] ${options.url} failed:`, normalizedError.message);
        
        throw normalizedError;
    }
};

export const http = {
    get: (url, config) => httpClient({ method: "GET", url, ...config }),
    post: (url, data, config) => httpClient({ method: "POST", url, data, ...config }),
    patch: (url, data, config) => httpClient({ method: "PATCH", url, data, ...config }),
    delete: (url, config) => httpClient({ method: "DELETE", url, ...config }),
};

export default http;
