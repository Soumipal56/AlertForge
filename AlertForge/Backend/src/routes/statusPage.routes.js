// FEATURE-9: Public Status Page Routes — No auth required
import express from "express";
import { publicApiLimiter } from "../middleware/rateLimiter/index.js";
import { getPublicStatusPage } from "../controller/statusPage.controller.js";

const statusPageRouter = express.Router();

// Public route — no authentication
statusPageRouter.get("/public/:userId", publicApiLimiter, getPublicStatusPage);

export default statusPageRouter;
