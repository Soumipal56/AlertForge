import express from "express";
import { createApiKey, listApiKeys, revokeApiKey } from "../controller/apikey.controller.js";
import { authApiLimiter, criticalApiLimiter, publicApiLimiter } from "../middleware/rateLimiter/index.js";
import { smartAuth } from "../middleware/smartAuth.middleware.js";

const apiKeyRouter = express.Router();

// All API key management requires dashboard session (cookie auth)
apiKeyRouter.use(smartAuth);

// FEATURE-7: Full API key management
apiKeyRouter.get("/", authApiLimiter, listApiKeys);
apiKeyRouter.post("/", criticalApiLimiter, createApiKey);
apiKeyRouter.delete("/:id", criticalApiLimiter, revokeApiKey);

export default apiKeyRouter;

