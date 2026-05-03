// FEATURE-8: Team System Routes
import express from "express";
import { smartAuth } from "../middleware/smartAuth.middleware.js";
import { adminOnly, responderOrAbove, anyRole } from "../middleware/rbac.middleware.js";
import { authApiLimiter, criticalApiLimiter } from "../middleware/rateLimiter/index.js";
import {
    getTeamMembers,
    inviteTeamMember,
    updateTeamMemberRole,
    removeTeamMember,
} from "../controller/team.controller.js";

const teamRouter = express.Router();

// All team routes require authentication
teamRouter.use(smartAuth);

// GET members — any authenticated admin can view their team
teamRouter.get("/members", authApiLimiter, adminOnly, getTeamMembers);

// POST invite — admin only
teamRouter.post("/invite", criticalApiLimiter, adminOnly, inviteTeamMember);

// PATCH role — admin only
teamRouter.patch("/role", criticalApiLimiter, adminOnly, updateTeamMemberRole);

// DELETE member — admin only
teamRouter.delete("/member/:id", criticalApiLimiter, adminOnly, removeTeamMember);

export default teamRouter;
