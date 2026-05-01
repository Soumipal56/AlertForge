import express from "express";
import { uploadMiddleware } from "../middleware/upload.middleware.js";
import { handleFileUpload } from "../controller/upload.controller.js";
import { heavyApiLimiter } from "../middleware/rateLimiter/index.js";

const router = express.Router();

/**
 * @route POST /api/upload
 * @description Uploads a file (image/pdf) to cloud storage and returns the URL.
 * @access Public (Protected by client-side auth in practice)
 */
router.post("/upload", heavyApiLimiter, uploadMiddleware.single("file"), handleFileUpload);

export default router;
