import express from "express";
import { attachApiKey, authMiddleware } from "../middleware/auth.middleware.js";
import { authApiLimiter, criticalApiLimiter } from "../middleware/rateLimiter/index.js";
import { 
    createIncident, 
    createAndBroadcastIncident,
    getAllIncidents, 
    getIncidentById, 
    updateIncidentStatus, 
    updateIncidentSeverity,
    getIncidentTimeline,
    addTimelineNote
} from "../controller/incident.controller.js";
import { smartAuth } from "../middleware/smartAuth.middleware.js";
import { adminOnly, responderOrAbove, anyRole } from "../middleware/rbac.middleware.js";


const incidentRouter = express.Router();

incidentRouter.use(smartAuth);
incidentRouter.use(authApiLimiter);

incidentRouter.post("/", responderOrAbove, createIncident);
// Alias route specifically for broadcasting
incidentRouter.post("/broadcast", responderOrAbove, createAndBroadcastIncident);

incidentRouter.get("/", anyRole, getAllIncidents);
incidentRouter.get("/:id", anyRole, getIncidentById);
incidentRouter.patch("/:id/status", criticalApiLimiter, responderOrAbove, updateIncidentStatus);
incidentRouter.patch("/:id/severity", criticalApiLimiter, adminOnly, updateIncidentSeverity);

// Timeline routes
incidentRouter.get("/:id/timeline", getIncidentTimeline);
incidentRouter.post("/:id/timeline", addTimelineNote);




export default incidentRouter;
