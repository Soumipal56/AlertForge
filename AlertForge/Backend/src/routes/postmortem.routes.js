import express from "express";
import { dualAuthMiddleware } from "../middleware/auth.middleware.js";
import { authApiLimiter, criticalApiLimiter } from "../middleware/rateLimiter/index.js";
import { generatePostmortemController, getPostmortemByIncidentId } from "../controller/postmortem.controller.js";

const postmortemRouter = express.Router();

postmortemRouter.use(dualAuthMiddleware);

postmortemRouter.get("/:incidentId", authApiLimiter, getPostmortemByIncidentId);
postmortemRouter.post("/generate/:incidentId", criticalApiLimiter, generatePostmortemController);

export default postmortemRouter;
