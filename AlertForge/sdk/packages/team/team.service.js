// sdk/packages/team/team.service.js
import { http } from "../../core/http/client.js";

export const teamService = {
    getMembers: () => http.get("/api/team/members"),
    invite: (email, role) => http.post("/api/team/invite", { email, role }),
    resendInvite: (id) => http.post(`/api/team/invite/${id}/resend`),
    revokeInvite: (id) => http.delete(`/api/team/invite/${id}`),
    updateRole: (id, role) => http.patch(`/api/team/members/${id}/role`, { role }),
    removeMember: (id) => http.delete(`/api/team/members/${id}`),
};
