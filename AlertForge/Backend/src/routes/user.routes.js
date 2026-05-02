import { Router } from "express";
import { getUserSettings, updateUserSettings, updateProfile } from "../controller/user.controller.js";
import { attachApiKey, authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);
router.use(attachApiKey);

router.get("/me/settings", getUserSettings);
router.patch("/me/settings", updateUserSettings);
router.patch("/profile", updateProfile);

export default router;
