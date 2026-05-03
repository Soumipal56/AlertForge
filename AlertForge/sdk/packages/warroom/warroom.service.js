// sdk/packages/warroom/warroom.service.js
import { http } from "../../core/http/client.js";
import { socketActions } from "../../core/socket/socketClient.js";

export const warroomService = {
    // REST methods
    getJoinToken: (incidentId) => http.get(`/api/warroom/${incidentId}/join`),
    getMessages: (incidentId) => http.get(`/api/warroom/${incidentId}/messages`),
    updateTask: (incidentId, taskId, data) => http.patch(`/api/warroom/${incidentId}/tasks/${taskId}`, data),

    // Socket methods (bridge to core socket)
    joinWarRoom: (incidentId) => socketActions.joinWarRoom(incidentId),
    sendMessage: (incidentId, message) => socketActions.sendMessage(incidentId, message),
    listenToPresence: (callback) => socketActions.on("room:presence", callback),
};
