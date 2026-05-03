import apiClient, { unwrap } from "@/lib/apiClient";

export const statusApi = {
    /** GET /api/status/public/:userId — fetch public status info */
    getPublicStatus: (userId) =>
        apiClient.get(`/api/status/public/${userId}`).then(unwrap),
};
