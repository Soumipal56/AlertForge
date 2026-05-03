// sdk/packages/postmortem/postmortem.service.js
import { http } from "../../core/http/client.js";

export const postmortemService = {
    generate: (incidentId) => http.post(`/api/postmortem/generate/${incidentId}`),
    getById: (id) => http.get(`/api/postmortem/${id}`),
    getByIncidentId: (incidentId) => http.get(`/api/postmortem/incident/${incidentId}`),
    update: (id, data) => http.patch(`/api/postmortem/${id}`, data),
    exportToMarkdown: (incidentId) => http.get(`/api/postmortem/export/${incidentId}`),
};
