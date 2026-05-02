import jwt from "jsonwebtoken";
import appConfig from "../config/appConfig.js";

const assertSecret = (secret, name) => {
    if (!secret) {
        throw new Error(`${name} is not configured`);
    }
};

export const generateAccessToken = (userId) => {
    assertSecret(appConfig.jwtAccessSecret, "JWT_ACCESS_SECRET");
    return jwt.sign({ userId }, appConfig.jwtAccessSecret, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId) => {
    assertSecret(appConfig.jwtRefreshSecret, "JWT_REFRESH_SECRET");
    return jwt.sign({ userId }, appConfig.jwtRefreshSecret, { expiresIn: "7d" });
};

export const verifyAccessToken = (token) => {
    assertSecret(appConfig.jwtAccessSecret, "JWT_ACCESS_SECRET");
    return jwt.verify(token, appConfig.jwtAccessSecret);
};

export const verifyRefreshToken = (token) => {
    assertSecret(appConfig.jwtRefreshSecret, "JWT_REFRESH_SECRET");
    return jwt.verify(token, appConfig.jwtRefreshSecret);
};
