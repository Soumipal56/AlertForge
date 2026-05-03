import apiClient, { unwrap } from "@/lib/apiClient";

export const warroomApi = {
    /** GET /api/warroom/:incidentId/join?token= — validate join token */
    join: (incidentId, token) =>
        apiClient
            .get(`/api/warroom/${incidentId}/join`, { params: { token } })
            .then(unwrap),

    /** GET /api/warroom/:roomId/messages */
    getMessages: (roomId) =>
        apiClient.get(`/api/warroom/${roomId}/messages`).then(unwrap),

    /** POST /api/warroom/messages */
    sendMessage: (payload) =>
        apiClient.post("/api/warroom/messages", payload).then(unwrap),

    /** PATCH /api/warroom/tasks */
    toggleTask: (payload) =>
        apiClient.patch("/api/warroom/tasks", payload).then(unwrap),
};
