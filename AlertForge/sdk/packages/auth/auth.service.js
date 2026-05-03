// sdk/packages/auth/auth.service.js
import { http } from "../../core/http/client.js";
import { setAccessToken } from "../../core/config/index.js";

export const authService = {
    login: async (email, password) => {
        const response = await http.post("/api/auth/login", { email, password });
        if (response.data?.accessToken) {
            setAccessToken(response.data.accessToken);
        }
        return response;
    },
    register: (data) => http.post("/api/auth/register", data),
    logout: () => {
        setAccessToken(null);
        return http.post("/api/auth/logout");
    },
    getMe: () => http.get("/api/auth/me"),
};
