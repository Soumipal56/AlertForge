import axios from "axios";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
    withCredentials: true, // Crucial for JWT/Cookie based auth
    headers: {
        "Content-Type": "application/json",
    },
});

const unwrapApiResponse = (response) => response.data?.data ?? response.data;

/**
 * REST API calls now rely strictly on the HttpOnly session cookie (JWT).
 * The API Key is no longer needed for these REST endpoints as the backend
 * resolves the active key from the logged-in user session.
 */

export const getIncidents = async () => {
    const response = await apiClient.get("/api/incidents");
    return unwrapApiResponse(response);
};

export const createIncident = async (incidentData) => {
    const response = await apiClient.post("/api/incidents", incidentData);
    return unwrapApiResponse(response);
};

export const updateIncidentStatus = async (incidentId, status) => {
    const response = await apiClient.patch(
        `/api/incidents/${incidentId}/status`,
        { status }
    );
    return unwrapApiResponse(response);
};

export default apiClient;
