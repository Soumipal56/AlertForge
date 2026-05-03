import axios from "axios";

export const BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:3000";

/**
 * Centralized Axios instance.
 * - withCredentials: sends the httpOnly cookie (JWT refresh) on every request
 * - Authorization: Bearer header is injected if an access token exists in localStorage
 */
const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — attach access token ──────────────────────────────
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("alertforge.accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response interceptor — auto-refresh on 401 ────────────────────────────
apiClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const status = error.response?.status;
        const config = error.config;

        if (status === 401 && !config._retry && !config.url?.includes("/api/auth/refresh")) {
            config._retry = true;
            try {
                const { data } = await apiClient.post("/api/auth/refresh");
                const newToken = data?.data?.accessToken;
                if (newToken) {
                    localStorage.setItem("alertforge.accessToken", newToken);
                    config.headers.Authorization = `Bearer ${newToken}`;
                }
                return apiClient(config);
            } catch {
                localStorage.removeItem("alertforge.accessToken");
                window.dispatchEvent(new CustomEvent("alertforge:auth-expired"));
            }
        }

        if (status === 403) {
            window.dispatchEvent(
                new CustomEvent("alertforge:access-denied", {
                    detail: error.response?.data?.message || "Access denied",
                })
            );
        }

        return Promise.reject(error);
    }
);

/**
 * Unwrap the standard API response envelope:
 * { success, message, data } → returns data (or the raw response if no envelope)
 */
export const unwrap = (response) => response.data?.data ?? response.data;

export default apiClient;
