// sdk/packages/incidents/incidents.service.js
import { http } from "../../core/http/client.js";

export const incidentsService = {
    createIncident: (data) => http.post("/api/incidents", data),
    getIncidents: (params) => http.get("/api/incidents", { params }),
    getIncidentById: (id) => http.get(`/api/incidents/${id}`),
    updateStatus: (id, status) => http.patch(`/api/incidents/${id}/status`, { status }),
    updateSeverity: (id, severity) => http.patch(`/api/incidents/${id}/severity`, { severity }),
    addTimelineEvent: (id, data) => http.post(`/api/incidents/${id}/timeline`, data),
};
