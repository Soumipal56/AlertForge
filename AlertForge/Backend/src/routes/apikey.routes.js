import express from "express";
import { createApiKey } from "../controller/apikey.controller.js";
import { publicApiLimiter } from "../middleware/rateLimiter/index.js";
import { dualAuthMiddleware } from "../middleware/auth.middleware.js";

const apiKeyRouter = express.Router();

apiKeyRouter.use(dualAuthMiddleware);

apiKeyRouter.post("/", publicApiLimiter, createApiKey);

export default apiKeyRouter;
