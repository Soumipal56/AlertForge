import express from "express";
import { uploadMiddleware } from "../middleware/upload.middleware.js";
import { handleFileUpload } from "../controller/upload.controller.js";
import { heavyApiLimiter } from "../middleware/rateLimiter/index.js";
import { smartAuth } from "../middleware/smartAuth.middleware.js";

const router = express.Router();

/**
 * @route POST /api/upload
 * @description Uploads a file (image/pdf) to cloud storage and returns the URL.
 * @access Private
 */
router.post(
    "/upload",
    smartAuth,
    heavyApiLimiter,
    uploadMiddleware.single("file"),
    handleFileUpload
);

export default router;
