import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";
import { loginService, loginWithGoogle, refreshAccessTokenService, registerService } from "../services/auth.service.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import {
    accessTokenCookieOptions,
    authCookieOptions,
    refreshTokenCookieOptions,
} from "../config/cookieOptions.js";
import { findUserByIdDAO } from "../dao/user.dao.js";
import appConfig from "../config/appConfig.js";
import { blacklistToken, isTokenBlacklisted } from "../services/redis/tokenBlacklist.service.js";

export const register = async (req, res, next) => {
    try {
        const { apiKey, accessToken, refreshToken } = await registerService(req.body || {});

        res.cookie("accessToken", accessToken, accessTokenCookieOptions);
        res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: "User registered successfully",
            apiKey,
            data: {
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { user, accessToken, refreshToken } = await loginService(req.body || {});

        res.cookie("accessToken", accessToken, accessTokenCookieOptions);
        res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};


export const refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken && await isTokenBlacklisted(refreshToken)) {
            throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Refresh token invalidated - please login again");
        }

        const accessToken = await refreshAccessTokenService(refreshToken);

        res.cookie("accessToken", accessToken, accessTokenCookieOptions);

        return res.status(HTTP_STATUS.OK).json(
            new ApiResponse(HTTP_STATUS.OK, "Access token refreshed")
        );
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;

        // Blacklist current tokens if they exist
        if (accessToken) {
            // Access tokens usually expire in 15m (900s)
            await blacklistToken(accessToken, 900);
        }
        if (refreshToken) {
            // Refresh tokens usually expire in 7d
            await blacklistToken(refreshToken, 7 * 24 * 60 * 60);
        }

        res.clearCookie("accessToken", authCookieOptions);
        res.clearCookie("refreshToken", authCookieOptions);

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
        console.log(googleProfile)
        if (!googleProfile) {
            return res.redirect(`${appConfig.frontendUrl}/login?error=google_auth_failed`);
        }

        // Login or create user with Google profile data
        const user = await loginWithGoogle(googleProfile);

        const userId = user._id.toString();
        const accessToken = generateAccessToken(userId);
        const refreshToken = generateRefreshToken(userId);

        // Set HTTP-only cookies
        res.cookie("accessToken", accessToken, accessTokenCookieOptions);
        res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

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
        const user = await findUserByIdDAO(req.user.id);
        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json(
                new ApiResponse(HTTP_STATUS.NOT_FOUND, "User not found")
            );
        }
        return res.status(HTTP_STATUS.OK).json(
            new ApiResponse(HTTP_STATUS.OK, "User fetched successfully", user)
        );
    } catch (error) {
        next(error);
    }
};

