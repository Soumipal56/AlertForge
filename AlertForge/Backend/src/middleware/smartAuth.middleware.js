import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/token.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";
import { findActiveApiKeyByUserDAO, findActiveApiKeyByHashedKeyDAO } from "../dao/apikey.dao.js";
import { hashKey } from "../utils/hashKey.js";

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
                throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.INVALID_API_KEY);
            }

            req.apiKey = apiKey;
            req.apiKeyId = apiKey._id;
            req.user = {
                id: apiKey.user._id,
                email: apiKey.user.email,
                role: apiKey.user.role,
                organizationId: apiKey.user.organizationId || apiKey.user._id,
                name: apiKey.user.name,
                teamEmails: apiKey.user.teamEmails || [],
                telegramChatId: apiKey.user.telegramChatId,
                discordWebhookUrl: apiKey.user.discordWebhookUrl,
                notificationSettings: apiKey.user.notificationSettings || {
                    emailEnabled: true,
                    telegramEnabled: false,
                    discordEnabled: false
                },
                authType: "api-key"
            };
            
            return next();
        }

        // CASE 2: NORMAL LOGIN FLOW (Dashboard)
        if (accessToken) {
            const decoded = verifyAccessToken(accessToken);
            if (!decoded?.userId) {
                throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.INVALID_TOKEN);
            }

            // We need to fetch the user (importing dynamically to avoid circular issues or just require it at top)
            // Wait, I need to import findUserByIdDAO. I'll add the import via another call.
            // But for now I'll use the user model directly or ensure the import is there.
            // Actually, I can just use the user DAO. Let's assume it's imported or I will import it next.
            // Also, we can still fetch the API key optionally.
            
            const { findUserByIdDAO } = await import("../dao/user.dao.js");
            const user = await findUserByIdDAO(decoded.userId);
            
            if (!user) {
                throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "User not found");
            }
            
            // Optionally fetch API key so existing code doesn't break
            const apiKey = await findActiveApiKeyByUserDAO(decoded.userId);
            if (apiKey) {
                req.apiKey = apiKey;
                req.apiKeyId = apiKey._id;
            }

            req.user = {
                id: user._id,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId || user._id,
                name: user.name,
                authType: "jwt"
            };

            return next();
        }



        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            "Unauthorized access - No valid session or API Key found"
        );

    } catch (error) {
        next(error);
    }
};