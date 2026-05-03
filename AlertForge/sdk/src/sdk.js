import { createClient } from "./client.js";

/**
 * AlertForge SDK Client
 * 
 * Minimal, stateless wrapper for the AlertForge REST API.
 * Requires an API Key for authentication.
 */
export class AlertForge {
  /**
   * @param {Object} options
   * @param {string} options.apiKey - Your AlertForge API key.
   * @param {string} [options.baseURL] - Optional override for the API base URL.
   */
  constructor({ apiKey, baseURL }) {
    if (!apiKey) {
      throw new Error("AlertForge SDK: apiKey is required.");
    }
    this.client = createClient(apiKey, baseURL);
  }

  /**
   * Creates a new incident and broadcasts it across configured channels.
   * 
   * @param {Object} data - Incident data.
   * @param {string} data.title - Title of the incident.
   * @param {string} data.service - Name of the affected service.
   * @param {string} data.severity - Severity level (P1, P2, P3).
   * @returns {Promise<Object>} The created incident data.
   */
  async createIncident(data) {
    return await this.client.post("/api/incidents/broadcast", data);
  }

  /**
   * Fetches all incidents for the organization.
   * 
   * @returns {Promise<Object>} List of incidents.
   */
  async getIncidents() {
    return await this.client.get("/api/incidents");
  }

  /**
   * Updates the status of an existing incident.
   * 
   * @param {string} id - The incident ID.
   * @param {string} status - The new status (investigating, identified, monitoring, resolved).
   * @returns {Promise<Object>} The updated incident data.
   */
  async updateIncidentStatus(id, status) {
    return await this.client.patch(`/api/incidents/${id}/status`, { status });
  }

  /**
   * Triggers the generation of an AI-powered postmortem for a resolved incident.
   * 
   * @param {string} incidentId - The resolved incident ID.
   * @returns {Promise<Object>} Postmortem generation status.
   */
  async generatePostmortem(incidentId) {
    return await this.client.post(`/api/postmortem/${incidentId}/generate`);
  }

  /**
   * Retrieves the authenticated user's profile and notification settings.
   * 
   * @returns {Promise<Object>} User profile data.
   */
  async getProfile() {
    return await this.client.get("/api/users/profile");
  }

  /**
   * Updates user profile details and notification preferences.
   * 
   * @param {Object} data - Update payload (name, teamEmails, telegramChatId, discordWebhookUrl, notificationSettings).
   * @returns {Promise<Object>} The updated user profile.
   */
  async updateProfile(data) {
    return await this.client.patch("/api/users/profile", data);
  }
}
