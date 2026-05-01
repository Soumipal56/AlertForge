import express from "express";
import { createApiKey } from "../controller/apikey.controller.js";
import { publicApiLimiter } from "../middleware/rateLimiter/index.js";

const apiKeyRouter = express.Router();

apiKeyRouter.post("/", publicApiLimiter, createApiKey);

export default apiKeyRouter;
