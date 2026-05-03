import express from "express";
import { authApiLimiter, criticalApiLimiter } from "../middleware/rateLimiter/index.js";
import { 
    createIncident, 
    createAndBroadcastIncident,
    getAllIncidents, 
    getIncidentById, 
    updateIncidentStatus, 
    updateIncidentSeverity,
    getIncidentTimeline,
    addTimelineNote,
    getIncidentSuggestionsController
} from "../controller/incident.controller.js";
import { smartAuth } from "../middleware/smartAuth.middleware.js";
import { adminOnly, responderOrAbove, anyRole } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { incidentSchema } from "../validators/incident.validator.js";

const incidentRouter = express.Router();

incidentRouter.use(smartAuth);
incidentRouter.use(authApiLimiter);

// CREATE
incidentRouter.post("/", 
    responderOrAbove, 
    validate(incidentSchema), 
    createIncident
);

incidentRouter.post("/broadcast", 
    responderOrAbove, 
    validate(incidentSchema), 
    createAndBroadcastIncident
);

// READ
incidentRouter.get("/", anyRole, getAllIncidents);
incidentRouter.get("/:id", anyRole, getIncidentById);

// UPDATE
incidentRouter.patch("/:id/status", 
    criticalApiLimiter, 
    responderOrAbove, 
    updateIncidentStatus
);

incidentRouter.patch("/:id/severity", 
    criticalApiLimiter, 
    adminOnly, 
    updateIncidentSeverity
);

// TIMELINE
incidentRouter.get("/:id/timeline", anyRole, getIncidentTimeline);
incidentRouter.post("/:id/timeline", responderOrAbove, addTimelineNote);

// AI SUGGESTIONS
incidentRouter.get("/:id/suggestions", anyRole, getIncidentSuggestionsController);

export default incidentRouter;
