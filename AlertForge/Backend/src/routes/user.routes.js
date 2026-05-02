import { Router } from "express";
import { getUserSettings, updateUserSettings } from "../controller/user.controller.js";
import { dualAuthMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.use(dualAuthMiddleware);

router.get("/:clerkId/settings", getUserSettings);
router.patch("/:clerkId/settings", updateUserSettings);

export default router;
