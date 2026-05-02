// FEATURE-6: Service Registry Routes
import express from "express";
import { smartAuth } from "../middleware/smartAuth.middleware.js";
import { authApiLimiter, criticalApiLimiter } from "../middleware/rateLimiter/index.js";
import {
    getAllServices,
    createService,
    getServiceById,
    updateService,
    updateServiceStatus,
    deleteService,
} from "../controller/service.controller.js";

const serviceRouter = express.Router();

// All service routes require auth
serviceRouter.use(smartAuth);

serviceRouter.get("/", authApiLimiter, getAllServices);
serviceRouter.post("/", criticalApiLimiter, createService);
serviceRouter.get("/:id", authApiLimiter, getServiceById);
serviceRouter.patch("/:id", authApiLimiter, updateService);
serviceRouter.patch("/:id/status", criticalApiLimiter, updateServiceStatus);
serviceRouter.delete("/:id", criticalApiLimiter, deleteService);

export default serviceRouter;
