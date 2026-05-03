import axios from "axios";

/**
 * Creates a pre-configured Axios client for the AlertForge API.
 * 
 * @param {string} apiKey - The AlertForge API key.
 * @param {string} baseURL - The base URL of the AlertForge API.
 * @returns {import("axios").AxiosInstance}
 */
export const createClient = (apiKey, baseURL = "https://alertforge.onrender.com") => {
  const client = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
  });

  // Response interceptor for better error messages
  client.interceptors.response.use(
    (response) => response.data,
    (error) => {
      const message = error.response?.data?.message || error.message;
      const status = error.response?.status || "NETWORK_ERROR";
      const url = error.config?.baseURL || baseURL;
      
      const apiError = new Error(`[AlertForge API Error ${status}]: ${message} (at ${url})`);
      apiError.status = status;
      apiError.response = error.response;
      
      throw apiError;
    }
  );

  return client;
};
