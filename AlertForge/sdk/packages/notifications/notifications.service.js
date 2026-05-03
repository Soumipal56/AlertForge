// sdk/packages/notifications/notifications.service.js
import { http } from "../../core/http/client.js";

export const notificationsService = {
    getSettings: () => http.get("/api/notifications/settings"),
    updateSettings: (data) => http.patch("/api/notifications/settings", data),
    testChannel: (channel) => http.post(`/api/notifications/test/${channel}`),
};
