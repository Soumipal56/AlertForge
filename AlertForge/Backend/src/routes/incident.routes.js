import express from "express";
import { dualAuthMiddleware } from "../middleware/auth.middleware.js";
import { authApiLimiter, criticalApiLimiter } from "../middleware/rateLimiter/index.js";
import { createIncident, getAllIncidents, getIncidentById, updateIncidentStatus } from "../controller/incident.controller.js";


const incidentRouter = express.Router();

incidentRouter.use(dualAuthMiddleware);
incidentRouter.use(authApiLimiter);

incidentRouter.post("/", createIncident);
incidentRouter.get("/", getAllIncidents);
incidentRouter.get("/:id", getIncidentById);
incidentRouter.patch("/:id/status", criticalApiLimiter, updateIncidentStatus);


export default incidentRouter;
