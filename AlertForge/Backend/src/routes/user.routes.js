import { Router } from "express";
import { getUserSettings, updateUserSettings } from "../controller/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/me/settings", getUserSettings);
router.patch("/me/settings", updateUserSettings);

export default router;
