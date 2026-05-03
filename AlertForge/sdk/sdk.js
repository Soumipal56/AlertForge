import { createClient } from "./client.js";

export class AlertForge {
  constructor({ apiKey, baseURL }) {
    if (!apiKey) throw new Error("API Key is required");
    this.client = createClient(apiKey, baseURL);
  }

  async createIncident(data) {
    const res = await this.client.post("/api/incidents/broadcast", data);
    return res.data;
  }

  async getIncidents() {
    const res = await this.client.get("/api/incidents");
    return res.data;
  }

  async updateIncidentStatus(id, status) {
    const res = await this.client.patch(`/api/incidents/${id}/status`, { status });
    return res.data;
  }

  async generatePostmortem(incidentId) {
    const res = await this.client.post(`/api/postmortem/${incidentId}/generate`);
    return res.data;
  }

  async getProfile() {
    const res = await this.client.get("/api/users/profile");
    return res.data;
  }

  async updateProfile(data) {
    const res = await this.client.patch("/api/users/profile", data);
    return res.data;
  }
}
