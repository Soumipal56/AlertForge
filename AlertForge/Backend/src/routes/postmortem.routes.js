import express from "express";
import { smartAuth } from "../middleware/smartAuth.middleware.js";
import { authApiLimiter, criticalApiLimiter } from "../middleware/rateLimiter/index.js";
import { generatePostmortemController, getPostmortemByIncidentId, updatePostmortemController } from "../controller/postmortem.controller.js";

const postmortemRouter = express.Router();

postmortemRouter.use(smartAuth);

postmortemRouter.get("/:incidentId", authApiLimiter, getPostmortemByIncidentId);
postmortemRouter.post("/generate/:incidentId", criticalApiLimiter, generatePostmortemController);
// FEATURE-5: Manual edit endpoint for postmortem fields
postmortemRouter.patch("/:incidentId", authApiLimiter, updatePostmortemController);

export default postmortemRouter;

