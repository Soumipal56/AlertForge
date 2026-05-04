import apiClient, { unwrap } from "@/lib/apiClient";

export const authApi = {

  register: ({ name, email, password }) =>
    apiClient.post("/api/auth/register", { name, email, password }).then(unwrap),


  login: ({ email, password }) =>
    apiClient.post("/api/auth/login", { email, password }).then(unwrap),


  logout: () =>
    apiClient.post("/api/auth/logout").then(unwrap),


  me: () =>
    apiClient.get("/api/auth/me").then(unwrap),

  /**
   * Google OAuth — NOT an axios call, it's a browser redirect.
   * Usage: window.location.href = authApi.googleUrl()
   *
   * Passport handles the Google redirect. After auth, backend sets cookies
   * and redirects to /dashboard. On mount, call authApi.me() to hydrate Redux.
   */
  googleUrl: () => {
    const BASE_URL =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:3000";
    return `${BASE_URL}/api/auth/google`;
  },
};