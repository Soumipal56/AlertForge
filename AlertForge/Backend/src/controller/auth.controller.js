import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";
import { loginService, refreshAccessTokenService, registerService } from "../services/auth.service.js";
import {
    accessTokenCookieOptions,
    authCookieOptions,
    refreshTokenCookieOptions,
} from "../config/cookieOptions.js";

export const register = async (req, res, next) => {
    try {
        const { apiKey, accessToken, refreshToken } = await registerService(req.body || {});

        res.cookie("accessToken", accessToken, accessTokenCookieOptions);
        res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: "User registered successfully",
            apiKey,
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

        return res.status(HTTP_STATUS.OK).json(
            new ApiResponse(HTTP_STATUS.OK, "Login successful", { user })
        );
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req, res, next) => {
    try {
        const accessToken = await refreshAccessTokenService(req.cookies?.refreshToken);

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
        res.clearCookie("accessToken", authCookieOptions);
        res.clearCookie("refreshToken", authCookieOptions);

        return res.status(HTTP_STATUS.OK).json(
            new ApiResponse(HTTP_STATUS.OK, "Logout successful")
        );
    } catch (error) {
        next(error);
    }
};
