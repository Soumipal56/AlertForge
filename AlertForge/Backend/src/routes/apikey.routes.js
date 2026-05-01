import express from "express";
import { createApiKey } from "../controller/apikey.controller.js";

const apiKeyRouter = express.Router();

apiKeyRouter.post("/", createApiKey);

export default apiKeyRouter;
