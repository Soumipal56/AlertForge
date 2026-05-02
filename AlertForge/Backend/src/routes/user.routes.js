import { Router } from "express";
import { getUserSettings, updateUserSettings } from "../controller/user.controller.js";

const router = Router();

// In production, these should be protected by Clerk middleware
router.get("/:clerkId/settings", getUserSettings);
router.patch("/:clerkId/settings", updateUserSettings);

export default router;
