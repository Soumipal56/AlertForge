import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/token.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";
import {
  findActiveApiKeyByUserDAO,
  findActiveApiKeyByKeyIdDAO,
} from "../dao/apikey.dao.js";
import { extractKeyId } from "../utils/hashKey.js";
import bcrypt from "bcryptjs";
import logger from "../utils/logger.js";

import { findUserByIdDAO } from "../dao/user.dao.js";

export const smartAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const accessToken = req.cookies?.accessToken || bearerToken;
    const apiKeyHeader = req.headers["x-api-key"];

    // CASE 1: SDK / API KEY FLOW
    if (apiKeyHeader) {
      const keyId = extractKeyId(apiKeyHeader);
      const apiKey = await findActiveApiKeyByKeyIdDAO(keyId);

      if (!apiKey || !apiKey.user) {
        logger.warn(`Invalid API Key attempt with keyId: ${keyId}`);
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.INVALID_API_KEY, 'INVALID_API_KEY');
      }

      // Verify the full key with bcrypt
      const isMatch = await bcrypt.compare(apiKeyHeader, apiKey.hashedKey);
      if (!isMatch) {
        logger.warn(`API Key secret mismatch for keyId: ${keyId}`);
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.INVALID_API_KEY, 'INVALID_API_KEY');
      }

      req.apiKey = apiKey;
      req.apiKeyId = apiKey._id;
      req.user = {
        id: apiKey.user._id,
        email: apiKey.user.email,
        role: apiKey.user.role,
        organizationId: apiKey.user.organizationId || apiKey.user._id,
        name: apiKey.user.name,
      };

      return next();
    }

    // CASE 2: NORMAL LOGIN FLOW (Dashboard)
    if (accessToken) {
      const decoded = verifyAccessToken(accessToken);
      if (!decoded?.userId) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.INVALID_TOKEN, 'INVALID_TOKEN');
      }

      const user = await findUserByIdDAO(decoded.userId);
      if (!user) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "User not found", 'USER_NOT_FOUND');
      }

      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || user._id,
        name: user.name
      };

      return next();
    }

    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized access - No valid session or API Key found", 'UNAUTHORIZED');
  } catch (error) {
    next(error);
  }
};

export const softAuth = (req, res, next) => {
  smartAuth(req, res, (err) => {
    if (err) {
      req.user = null;
    }
    next();
  });
};
