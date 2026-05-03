import { Router } from "express";
import { getUserSettings, updateUserSettings, updateProfile } from "../controller/user.controller.js";
import { smartAuth } from "../middleware/smartAuth.middleware.js";

import { validateUserProfileUpdate } from "../validators/user.validator.js";

const router = Router();

router.use(smartAuth);

router.get("/me/settings", getUserSettings);
router.patch("/me/settings", updateUserSettings);
router.patch("/profile", validateUserProfileUpdate, updateProfile);

export default router;
