import { Router } from "express";
import { uptimerobotWebhook } from "../controller/webhook.controller.js";

const router = Router();

// Endpoint: POST /api/webhooks/uptimerobot?apiKey=...
router.post("/uptimerobot", uptimerobotWebhook);

export default router;
