import bcrypt from "bcryptjs";
import ApiError from "../utils/ApiError.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/token.js";
import { ERROR_MESSAGES, HTTP_STATUS } from "../config/constants.js";
import { createUserDAO, findUserByEmailDAO, findUserByEmailWithPasswordDAO, findUserByIdDAO } from "../dao/user.dao.js";
import { createApiKeyDAO } from "../dao/apikey.dao.js";
import { generateApiKey } from "../utils/generateApiKey.js";
import { hashKey } from "../utils/hashKey.js";

const normalizeEmail = (email) => typeof email === "string" ? email.trim().toLowerCase() : "";

export const registerService = async ({ email, password }) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Email and password are required");
    }

    const existingUser = await findUserByEmailDAO(normalizedEmail);
    if (existingUser) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    let user;

    try {
        user = await createUserDAO({
            email: normalizedEmail,
            emailAddress: normalizedEmail,
            password: hashedPassword,
        });
    } catch (error) {
        if (error?.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0];
            const message = duplicateField === "email"
                ? "User already exists"
                : `Duplicate user index conflict: ${duplicateField || "unknown"}`;

            throw new ApiError(HTTP_STATUS.BAD_REQUEST, message);
        }

        throw error;
    }

    const rawApiKey = generateApiKey();
    await createApiKeyDAO({
        key: hashKey(rawApiKey),
        user: user._id,
        isActive: true,
    });

    const userId = user._id.toString();

    return {
        apiKey: rawApiKey,
        accessToken: generateAccessToken(userId),
        refreshToken: generateRefreshToken(userId),
    };
};

export const loginService = async ({ email, password }) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Email and password are required");
    }

    const user = await findUserByEmailWithPasswordDAO(normalizedEmail);
    if (!user || !user.password) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const userId = user._id.toString();

    return {
        user: {
            id: user._id,
            email: user.email,
        },
        accessToken: generateAccessToken(userId),
        refreshToken: generateRefreshToken(userId),
    };
};

export const refreshAccessTokenService = async (refreshToken) => {
    if (!refreshToken) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.UNAUTHORIZED);
    }

    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.INVALID_TOKEN);
    }

    const user = await findUserByIdDAO(decoded.userId);
    if (!user) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.INVALID_TOKEN);
    }

    return generateAccessToken(user._id.toString());
};
