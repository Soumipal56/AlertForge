// sdk/core/config/index.js

let config = {
    baseURL: process.env.ALERTFORGE_BASE_URL || "http://localhost:3000",
    socketURL: process.env.ALERTFORGE_SOCKET_URL || "http://localhost:3000",
    apiKey: null,
    accessToken: null,
};

/**
 * Update the base REST API URL at runtime.
 * @param {string} url 
 */
export const setBaseURL = (url) => {
    config.baseURL = url;
};

/**
 * Update the base Socket.io URL at runtime.
 * @param {string} url 
 */
export const setSocketURL = (url) => {
    config.socketURL = url;
};

/**
 * Set the API key for SDK-wide authentication.
 * @param {string} key 
 */
export const setApiKey = (key) => {
    config.apiKey = key;
};

/**
 * Set the Access Token (JWT) for dashboard-style authentication.
 * @param {string} token 
 */
export const setAccessToken = (token) => {
    config.accessToken = token;
};

export const getConfig = () => ({ ...config });

export default config;
