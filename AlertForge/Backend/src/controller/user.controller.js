import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";
import { findUserByIdDAO, updateUserByIdDAO } from "../dao/user.dao.js";

/**
 * @description Get notification settings for the authenticated user
 */
export const getUserSettings = async (req, res, next) => {
    try {
        const settings = await findUserByIdDAO(req.user.userId);

        if (!settings) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
        }

        return res.json(new ApiResponse(HTTP_STATUS.OK, "Settings fetched successfully", settings));
    } catch (error) {
        next(error);
    }
};

/**
 * @description Update notification settings for a user
 */
export const updateUserSettings = async (req, res, next) => {
    try {
        const updates = req.body;

        const settings = await updateUserByIdDAO(req.user.userId, updates);

        if (!settings) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
        }

        return res.json(new ApiResponse(HTTP_STATUS.OK, "Settings updated successfully", settings));
    } catch (error) {
        next(error);
    }
};
/**
 * @description Update user profile and notification settings
 */
export const updateProfile = async (req, res, next) => {
    try {
        const { name, teamEmails, discordWebhookUrl, discordWebhookUrls, telegramChatId, telegramChatIds, notificationSettings } = req.body;
        const userId = req.user.userId;

        // Basic Validation
        if (teamEmails && Array.isArray(teamEmails)) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!teamEmails.every(email => emailRegex.test(email))) {
                throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid email format in teamEmails");
            }
        }

        if (discordWebhookUrl) {
            const urlRegex = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\//;
            if (!urlRegex.test(discordWebhookUrl)) {
                throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid Discord Webhook URL");
            }
        }

        if (discordWebhookUrls && Array.isArray(discordWebhookUrls)) {
            const urlRegex = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\//;
            if (!discordWebhookUrls.every(url => urlRegex.test(url))) {
                throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid Discord Webhook URL in discordWebhookUrls");
            }
        }

        const updates = {
            name,
            teamEmails,
            discordWebhookUrl,
            discordWebhookUrls,
            telegramChatId: telegramChatId?.toString(),
            telegramChatIds: telegramChatIds?.map(id => id.toString()),
            notificationSettings
        };

        const updatedUser = await updateUserByIdDAO(userId, updates);

        if (!updatedUser) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
        }

        return res.json(new ApiResponse(HTTP_STATUS.OK, "Profile updated successfully", updatedUser));
    } catch (error) {
        next(error);
    }
};
