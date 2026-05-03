import express from "express";
import { smartAuth } from "../middleware/smartAuth.middleware.js";
import { authApiLimiter, criticalApiLimiter } from "../middleware/rateLimiter/index.js";
import { adminOnly, responderOrAbove, anyRole } from "../middleware/rbac.middleware.js";
import { generatePostmortemController, getPostmortemByIncidentId, updatePostmortemController, exportPostmortem } from "../controller/postmortem.controller.js";

const postmortemRouter = express.Router();

postmortemRouter.use(smartAuth);

postmortemRouter.get("/:incidentId", authApiLimiter, anyRole, getPostmortemByIncidentId);
postmortemRouter.post("/generate/:incidentId", criticalApiLimiter, responderOrAbove, generatePostmortemController);
// FEATURE-5: Manual edit endpoint for postmortem fields
postmortemRouter.patch("/:incidentId", authApiLimiter, responderOrAbove, updatePostmortemController);
postmortemRouter.get("/export/:incidentId", authApiLimiter, anyRole, exportPostmortem);

export default postmortemRouter;

