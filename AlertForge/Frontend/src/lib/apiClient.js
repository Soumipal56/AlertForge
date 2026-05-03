import axios from "axios";

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends HttpOnly cookies on every request — this IS the auth
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error) => {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  pendingQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const status = error.response?.status;
    const config = error.config;

    if (
      status === 401 &&
      !config._retry &&
      !config.url?.includes("/api/auth/refresh")
    ) {
      if (isRefreshing) {
        // Another refresh is already in flight — queue this request
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then(() => apiClient(config))
          .catch((err) => Promise.reject(err));
      }

      config._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );

        processQueue(null);
        return apiClient(config); // retry original request
      } catch (refreshError) {
        // Refresh token also expired — session fully dead
        processQueue(refreshError);
        window.dispatchEvent(new CustomEvent("alertforge:auth-expired"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 403) {
      window.dispatchEvent(
        new CustomEvent("alertforge:access-denied", {
          detail:
            error.response?.data?.message ||
            "You don't have permission to do this.",
        }),
      );
    }

    if (status === 429 && !config._retried429) {
      config._retried429 = true;

      const retryAfter = parseInt(
        error.response?.headers?.["retry-after"] || "5",
        10,
      );

      // Fire event so UI can show a toast with the wait time
      window.dispatchEvent(
        new CustomEvent("alertforge:rate-limited", {
          detail: { retryAfter },
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return apiClient(config);
    }

    return Promise.reject(error);
  },
);

export const unwrap = (response) => response.data?.data ?? response.data;

export default apiClient;
