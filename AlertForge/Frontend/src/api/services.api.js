import apiClient, { unwrap } from "@/lib/apiClient";

export const servicesApi = {
    /** GET /api/services */
    getAll: () =>
        apiClient.get("/api/services").then(unwrap),

    /** GET /api/services/:id */
    getById: (id) =>
        apiClient.get(`/api/services/${id}`).then(unwrap),

    /** POST /api/services */
    create: (payload) =>
        apiClient.post("/api/services", payload).then(unwrap),

    /** PATCH /api/services/:id */
    update: (id, payload) =>
        apiClient.patch(`/api/services/${id}`, payload).then(unwrap),

    /** PATCH /api/services/:id/status */
    updateStatus: (id, status) =>
        apiClient.patch(`/api/services/${id}/status`, { status }).then(unwrap),

    /** DELETE /api/services/:id */
    delete: (id) =>
        apiClient.delete(`/api/services/${id}`).then(unwrap),
};
