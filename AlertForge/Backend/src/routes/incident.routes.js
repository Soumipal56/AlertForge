
import express from "express";
import { validateApiKey } from "../middleware/apiKey.middleware.js";
import { createIncident, getAllIncidents, getIncidentById, updateIncidentStatus } from "../controller/incident.controller.js";


const incidentRouter = express.Router();

incidentRouter.use(validateApiKey);

incidentRouter.post("/", createIncident);
incidentRouter.get("/", getAllIncidents);
incidentRouter.get("/:id", getIncidentById);
incidentRouter.patch("/:id/status", updateIncidentStatus);



export default incidentRouter;
