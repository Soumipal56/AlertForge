import express from "express";
import { createApiKey } from "../controller/apikey.controller.js";
import { publicApiLimiter } from "../middleware/rateLimiter/index.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const apiKeyRouter = express.Router();

apiKeyRouter.post("/", authMiddleware, publicApiLimiter, createApiKey);

export default apiKeyRouter;
