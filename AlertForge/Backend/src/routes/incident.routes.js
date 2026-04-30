
import express from "express";
import { validateApiKey } from "../middleware/apiKey.middleware.js";
import { createIncident } from "../controller/incident.controller.js";


const incidentRouter = express.Router();

incidentRouter.post("/incident", validateApiKey, createIncident);

export default incidentRouter;