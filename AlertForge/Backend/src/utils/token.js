import jwt from "jsonwebtoken";
import crypto from "crypto";
import appConfig from "../config/appConfig.js";

const assertSecret = (secret, name) => {
    if (!secret) {
        throw new Error(`${name} is not configured`);
    }
};

export const generateAccessToken = (userId) => {
    assertSecret(appConfig.jwtAccessSecret, "JWT_ACCESS_SECRET");
    const jti = crypto.randomBytes(16).toString("hex");
    return jwt.sign({ userId, jti }, appConfig.jwtAccessSecret, { expiresIn: "7d" });
};

export const verifyAccessToken = (token) => {
    assertSecret(appConfig.jwtAccessSecret, "JWT_ACCESS_SECRET");
    return jwt.verify(token, appConfig.jwtAccessSecret);
};
