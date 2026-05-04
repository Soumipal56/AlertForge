import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";
import { loginService, loginWithGoogle, registerService } from "../services/auth.service.js";
import { generateAccessToken } from "../utils/token.js";
import {
    accessTokenCookieOptions,
    authCookieOptions,
} from "../config/cookieOptions.js";
import { findUserByIdDAO } from "../dao/user.dao.js";
import appConfig from "../config/appConfig.js";
import { blacklistToken } from "../services/redis/tokenBlacklist.service.js";


export const register = async (req, res, next) => {
    try {
        const { apiKey, accessToken } = await registerService(req.body || {});

        res.cookie("accessToken", accessToken, accessTokenCookieOptions);

        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: "User registered successfully",
            apiKey,
            data: {
                accessToken,
            }
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { user, accessToken } = await loginService(req.body || {});

        res.cookie("accessToken", accessToken, accessTokenCookieOptions);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                },
                accessToken,
            }
        });
    } catch (error) {
        next(error);
    }
};


export const logout = async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken;

        // Blacklist current tokens if they exist
        if (accessToken) {
            // Access tokens usually expire in 7d now
            await blacklistToken(accessToken, 7 * 24 * 60 * 60);
        }

        res.clearCookie("accessToken", authCookieOptions);

        return res.status(HTTP_STATUS.OK).json(
            new ApiResponse(HTTP_STATUS.OK, "Logout successful")
        );
    } catch (error) {
        next(error);
    }
};

// Google OAuth callback handler
export const googleCallback = async (req, res, next) => {
    try {
        // req.user is populated by Passport after successful Google authentication
        const googleProfile = req.user;
        if (!googleProfile) {
            return res.redirect(`${appConfig.frontendUrl}/login?error=google_auth_failed`);
        }

        // Login or create user with Google profile data
        const user = await loginWithGoogle(googleProfile);

        const userId = user._id.toString();
        const accessToken = generateAccessToken(userId);

        // Set HTTP-only cookies
        res.cookie("accessToken", accessToken, accessTokenCookieOptions);

        // Redirect based on user role
        const redirectPath = user.role === "admin" ? "/dashboard" : "/dashboard";
        return res.redirect(`${appConfig.frontendUrl}${redirectPath}`);
    } catch (error) {
        // Redirect to frontend with error message
        const errorMessage = error.message || "Google authentication failed";
        return res.redirect(`${appConfig.frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`);
    }
};

// Initiates Google OAuth flow
export const googleLogin = (req, res, next) => {
    // Passport will handle the redirect to Google
    // No need to do anything here, passport.authenticate will handle it
};

// Get current authenticated user
export const getMe = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Not authenticated",
                data: null
            });
        }

        const user = await findUserByIdDAO(req.user.id);
        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json(
                new ApiResponse(HTTP_STATUS.NOT_FOUND, "User found but not in database")
            );
        }
        return res.status(HTTP_STATUS.OK).json(
            new ApiResponse(HTTP_STATUS.OK, "User fetched successfully", user)
        );
    } catch (error) {
        next(error);
    }
};
