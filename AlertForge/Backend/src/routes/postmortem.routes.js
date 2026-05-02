import express from "express";
import { attachApiKey, authMiddleware } from "../middleware/auth.middleware.js";
import { authApiLimiter, criticalApiLimiter } from "../middleware/rateLimiter/index.js";
import { generatePostmortemController, getPostmortemByIncidentId } from "../controller/postmortem.controller.js";

const postmortemRouter = express.Router();

postmortemRouter.use(authMiddleware);
postmortemRouter.use(attachApiKey);

postmortemRouter.get("/:incidentId", authApiLimiter, getPostmortemByIncidentId);
postmortemRouter.post("/generate/:incidentId", criticalApiLimiter, generatePostmortemController);

export default postmortemRouter;
