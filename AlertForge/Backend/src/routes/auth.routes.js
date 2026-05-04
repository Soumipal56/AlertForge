import { Router } from "express";
import passport from "passport";
import { login, logout, register, googleCallback, getMe } from "../controller/auth.controller.js";
import { smartAuth, softAuth } from "../middleware/smartAuth.middleware.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", softAuth, getMe);


// Google OAuth 2.0 routes
authRouter.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
);
authRouter.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    googleCallback
);

export default authRouter;
