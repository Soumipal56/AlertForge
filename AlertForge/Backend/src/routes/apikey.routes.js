import express from "express";
import { createApiKey } from "../controller/apikey.controller.js";
import { publicApiLimiter } from "../middleware/rateLimiter/index.js";
import { attachApiKey, authMiddleware } from "../middleware/auth.middleware.js";

const apiKeyRouter = express.Router();

apiKeyRouter.use(authMiddleware);
apiKeyRouter.use(attachApiKey);

apiKeyRouter.post("/", publicApiLimiter, createApiKey);

export default apiKeyRouter;
