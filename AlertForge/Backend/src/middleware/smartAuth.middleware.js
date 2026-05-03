import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/token.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";
import {
  findActiveApiKeyByUserDAO,
  findActiveApiKeyByHashedKeyDAO,
} from "../dao/apikey.dao.js";
import { findUserByIdDAO } from "../dao/user.dao.js";
import { hashKey } from "../utils/hashKey.js";
import { isTokenBlacklisted } from "../services/redis/tokenBlacklist.service.js";

export const smartAuth = async (req, res, next) => {
  try {
        const authHeader = req.headers["authorization"];
        const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const accessToken = req.cookies?.accessToken || bearerToken;
    const apiKeyHeader = req.headers["x-api-key"];

        // Debug Logs (Temporary)
        console.log("Auth Attempt - Cookies:", !!accessToken, "| API Key Header:", !!apiKeyHeader);

    // CASE 1: SDK / API KEY FLOW
    if (apiKeyHeader) {
      const hashedKey = hashKey(apiKeyHeader);
      const apiKey = await findActiveApiKeyByHashedKeyDAO(hashedKey);

      if (!apiKey || !apiKey.user) {
        throw new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_MESSAGES.AUTH.INVALID_API_KEY,
        );
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
                throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.INVALID_TOKEN);
            }

            // Fetch full user to get organizationId
            const apiKey = await findActiveApiKeyByUserDAO(decoded.userId);
            if (!apiKey || !apiKey.user) {
                throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "User or API Key not found");
            }

            req.apiKey = apiKey;
            req.apiKeyId = apiKey._id;
            req.user = {
                id: apiKey.user._id,
                email: apiKey.user.email,
                role: apiKey.user.role,
                organizationId: apiKey.user.organizationId || apiKey.user._id,
                name: apiKey.user.name
            };

            return next();
        }


    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      "Unauthorized access - No valid session or API Key found",
    );
  } catch (error) {
    next(error);
  }
};
