import axios from "axios";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use((config) => {
    const apiKey = window.localStorage.getItem("alertforge_api_key");

    if (apiKey) {
        config.headers["x-api-key"] = apiKey;
    }

    return config;
});

const unwrapApiResponse = (response) => response.data?.data ?? response.data;

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
