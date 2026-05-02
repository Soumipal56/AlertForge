import express from "express";
import { validateApiKey } from "../middleware/apiKey.middleware.js";
import { authApiLimiter } from "../middleware/rateLimiter/index.js";
import { getPostmortemByIncidentId } from "../controller/postmortem.controller.js";

const postmortemRouter = express.Router();

postmortemRouter.use(validateApiKey);
postmortemRouter.use(authApiLimiter);

postmortemRouter.get("/:incidentId", getPostmortemByIncidentId);

export default postmortemRouter;
