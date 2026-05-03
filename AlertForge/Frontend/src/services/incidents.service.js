import apiClient, { unwrap } from "@/lib/apiClient";

const API_TO_UI_STATUS = {
  active: "Active",
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

const UI_TO_API_STATUS = {
  Active: "active",
  Investigating: "investigating",
  Identified: "identified",
  Monitoring: "monitoring",
  Resolved: "resolved",
};


const API_TO_UI_SEVERITY = { P1: "P1", P2: "P2", P3: "P3" };
const UI_TO_API_SEVERITY = { P1: "P1", P2: "P2", P3: "P3" };

export const toUIStatus = (s) => API_TO_UI_STATUS[s] ?? s;
export const toAPIStatus = (s) => UI_TO_API_STATUS[s] ?? s.toLowerCase();
export const toUISeverity = (s) => API_TO_UI_SEVERITY[s] ?? s;
export const toAPISeverity = (s) => UI_TO_API_SEVERITY[s] ?? s;

export const normalizeIncident = (incident) => ({
  ...incident,
  id:       incident._id ?? incident.id,
  // remap backend fields → UI field names
  title:    incident.message ?? incident.title ?? "",
  service:  incident.service ?? "",
  status:   toUIStatus(incident.status),
  severity: toUISeverity(incident.severity),
  startedAt: incident.createdAt ?? incident.startedAt,
});

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export const incidentApi = {
  /** GET /api/incidents */
  getAll: () => apiClient.get("/api/incidents").then(unwrap),

  /** GET /api/incidents/:id */
  getById: (id) => apiClient.get(`/api/incidents/${id}`).then(unwrap),

  /** POST /api/incidents */
  create: ({ title, service, severity }) =>
    apiClient
      .post("/api/incidents", {
        title,
        message: title, // backend syncs both
        service,
        severity: toAPISeverity(severity),
      })
      .then(unwrap),

  /** PATCH /api/incidents/:id/status */
  updateStatus: (id, uiStatus) =>
    apiClient
      .patch(`/api/incidents/${id}/status`, {
        status: toAPIStatus(uiStatus),
      })
      .then(unwrap),

  /** PATCH /api/incidents/:id/severity — admin only */
  updateSeverity: (id, uiSeverity) =>
    apiClient
      .patch(`/api/incidents/${id}/severity`, {
        severity: toAPISeverity(uiSeverity),
      })
      .then(unwrap),

  /** GET /api/incidents/:id/timeline */
  getTimeline: (id) =>
    apiClient.get(`/api/incidents/${id}/timeline`).then(unwrap),

  /** POST /api/incidents/:id/timeline */
  addTimelineNote: (id, { message, isPublic = false }) =>
    apiClient
      .post(`/api/incidents/${id}/timeline`, { message, isPublic })
      .then(unwrap),
};
