import apiClient, { unwrap } from "@/lib/apiClient";

export const incidentsApi = {
    /** GET /api/incidents */
    getAll: (params = {}) =>
        apiClient.get("/api/incidents", { params }).then(unwrap),

    /** GET /api/incidents/:id */
    getById: (id) =>
        apiClient.get(`/api/incidents/${id}`).then(unwrap),

    /** POST /api/incidents */
    create: (payload) =>
        apiClient.post("/api/incidents", payload).then(unwrap),

    /** POST /api/incidents/broadcast (creates + sends notifications with join link) */
    broadcast: (payload) =>
        apiClient.post("/api/incidents/broadcast", payload).then(unwrap),

    /** PATCH /api/incidents/:id/status */
    updateStatus: (id, status) =>
        apiClient.patch(`/api/incidents/${id}/status`, { status }).then(unwrap),

    /** PATCH /api/incidents/:id/severity */
    updateSeverity: (id, severity) =>
        apiClient.patch(`/api/incidents/${id}/severity`, { severity }).then(unwrap),

    /** GET /api/incidents/:id/timeline */
    getTimeline: (id) =>
        apiClient.get(`/api/incidents/${id}/timeline`).then(unwrap),

    /** POST /api/incidents/:id/timeline */
    addTimelineNote: (id, payload) =>
        apiClient.post(`/api/incidents/${id}/timeline`, payload).then(unwrap),
};
