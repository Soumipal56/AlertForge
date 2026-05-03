import apiClient, { unwrap } from "@/lib/apiClient";

export const postmortemApi = {
    /** GET /api/postmortem/:incidentId */
    getByIncident: (incidentId) =>
        apiClient.get(`/api/postmortem/${incidentId}`).then(unwrap),

    /** POST /api/postmortem/generate/:incidentId — AI generation */
    generate: (incidentId) =>
        apiClient.post(`/api/postmortem/generate/${incidentId}`).then(unwrap),

    /** PATCH /api/postmortem/:incidentId — manual field update */
    update: (incidentId, payload) =>
        apiClient.patch(`/api/postmortem/${incidentId}`, payload).then(unwrap),
};
