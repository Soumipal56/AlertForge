import express from "express";
import { getWarRoomMessages, sendWarRoomMessage, toggleWarRoomTask } from "../controller/warroom.controller.js";
import { smartAuth } from "../middleware/smartAuth.middleware.js";
import { authApiLimiter } from "../middleware/rateLimiter/index.js";

const warRoomRouter = express.Router();

// All War Room interactions require authentication (Dashboard or SDK)
warRoomRouter.use(smartAuth);

/**
 * FEATURE-4: Real-time War Room API
 */
warRoomRouter.get("/:roomId/messages", authApiLimiter, getWarRoomMessages);
warRoomRouter.post("/messages", authApiLimiter, sendWarRoomMessage);
warRoomRouter.patch("/tasks", authApiLimiter, toggleWarRoomTask);

export default warRoomRouter;
