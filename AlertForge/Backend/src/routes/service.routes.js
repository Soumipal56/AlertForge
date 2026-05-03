// FEATURE-6: Service Registry Routes
import express from "express";
import { smartAuth } from "../middleware/smartAuth.middleware.js";
import { authApiLimiter, criticalApiLimiter } from "../middleware/rateLimiter/index.js";
import { adminOnly, responderOrAbove, anyRole } from "../middleware/rbac.middleware.js";
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

serviceRouter.get("/", authApiLimiter, anyRole, getAllServices);
serviceRouter.post("/", criticalApiLimiter, adminOnly, createService);
serviceRouter.get("/:id", authApiLimiter, anyRole, getServiceById);
serviceRouter.patch("/:id", authApiLimiter, adminOnly, updateService);
serviceRouter.patch("/:id/status", criticalApiLimiter, responderOrAbove, updateServiceStatus);
serviceRouter.delete("/:id", criticalApiLimiter, adminOnly, deleteService);

export default serviceRouter;
