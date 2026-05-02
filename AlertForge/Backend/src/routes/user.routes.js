import { Router } from "express";
import { getUserSettings, updateUserSettings } from "../controller/user.controller.js";
import { attachApiKey, authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);
router.use(attachApiKey);

router.get("/me/settings", getUserSettings);
router.patch("/me/settings", updateUserSettings);

export default router;
