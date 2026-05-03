import apiClient, { unwrap } from "@/lib/apiClient";

export const authApi = {
    /** POST /api/auth/login */
    login: (email, password) =>
        apiClient.post("/api/auth/login", { email, password }).then(unwrap),

    /** POST /api/auth/register */
    register: (payload) =>
        apiClient.post("/api/auth/register", payload).then(unwrap),

    /** POST /api/auth/logout */
    logout: () =>
        apiClient.post("/api/auth/logout").then(unwrap),

    /** POST /api/auth/refresh */
    refresh: () =>
        apiClient.post("/api/auth/refresh").then(unwrap),

    /** GET /api/auth/me — get current session user */
    me: () =>
        apiClient.get("/api/auth/me").then(unwrap),
};

export const apiKeyApi = {
    /** GET /api/apikeys */
    list: () =>
        apiClient.get("/api/apikeys").then(unwrap),

    /** POST /api/apikeys */
    create: (name, serviceName) =>
        apiClient.post("/api/apikeys", { name, serviceName }).then(unwrap),

    /** DELETE /api/apikeys/:id */
    revoke: (id) =>
        apiClient.delete(`/api/apikeys/${id}`).then(unwrap),
};
