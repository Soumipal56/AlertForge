import axios from "axios";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
    headers: {
        "Content-Type": "application/json",
    },
});

const unwrapApiResponse = (response) => response.data?.data ?? response.data;

const withApiKey = (apiKey, config = {}) => {
    const nextConfig = {
        ...config,
        headers: {
            ...(config.headers || {}),
        },
    };

    if (typeof apiKey === "string" && apiKey.trim()) {
        nextConfig.headers["x-api-key"] = apiKey.trim();
    }

    return nextConfig;
};

export const getIncidents = async (apiKey) => {
    const response = await apiClient.get("/api/incidents", withApiKey(apiKey));
    return unwrapApiResponse(response);
};

export const createIncident = async (incidentData, apiKey) => {
    const response = await apiClient.post("/api/incidents", incidentData, withApiKey(apiKey));

    return unwrapApiResponse(response);
};

export const updateIncidentStatus = async (incidentId, status, apiKey) => {
    const response = await apiClient.patch(
        `/api/incidents/${incidentId}/status`,
        { status },
        withApiKey(apiKey)
    );

    return unwrapApiResponse(response);
};
