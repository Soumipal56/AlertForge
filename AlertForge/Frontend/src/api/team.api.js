import apiClient, { unwrap } from "@/lib/apiClient";

export const teamApi = {
    /** GET /api/team/members */
    getMembers: () =>
        apiClient.get("/api/team/members").then(unwrap),

    /** POST /api/team/invite */
    invite: (email, role) =>
        apiClient.post("/api/team/invite", { email, role }).then(unwrap),

    /** PATCH /api/team/role */
    updateRole: (memberId, role) =>
        apiClient.patch("/api/team/role", { memberId, role }).then(unwrap),

    /** DELETE /api/team/member/:id */
    removeMember: (memberId) =>
        apiClient.delete(`/api/team/member/${memberId}`).then(unwrap),
};
