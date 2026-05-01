
import express from "express";
import { validateApiKey } from "../middleware/apiKey.middleware.js";
import { createIncident, getAllIncidents, getIncidentById, updateIncidentStatus } from "../controller/incident.controller.js";


const incidentRouter = express.Router();


incidentRouter.post("/", validateApiKey, createIncident);

incidentRouter.get("/", validateApiKey, getAllIncidents);

incidentRouter.get("/:id", validateApiKey, getIncidentById);

incidentRouter.patch("/:id/status", validateApiKey, updateIncidentStatus);



export default incidentRouter;