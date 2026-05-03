import axios from "axios";

export const createClient = (apiKey, baseURL = "https://alertforge.onrender.com") => {
  return axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const message = error.response?.data?.message || error.message;
      const status = error.response?.status || "NETWORK_ERROR";
      const url = error.config?.baseURL || baseURL;
      throw new Error(`[AlertForge API Error ${status}]: ${message} (at ${url})`);
    }
  );

  return client;
};
