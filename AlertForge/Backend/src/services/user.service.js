import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../config/constants.js";
import { updateUserProfileDAO, findUserByIdDAO } from "../dao/user.dao.js";

export const updateUserProfileService = async (userId, payload) => {
    // 1. Fetch current user state to handle partial toggles
    const currentUser = await findUserByIdDAO(userId);
    if (!currentUser) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    // 2. Clean payload
    const updateData = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.teamEmails !== undefined) updateData.teamEmails = payload.teamEmails;
    if (payload.telegramChatId !== undefined) updateData.telegramChatId = payload.telegramChatId;
    if (payload.discordWebhookUrl !== undefined) updateData.discordWebhookUrl = payload.discordWebhookUrl;
    if (payload.notificationSettings !== undefined) updateData.notificationSettings = payload.notificationSettings;

    // 3. Merge state for validation
    const mergedSettings = { ...currentUser.notificationSettings, ...updateData.notificationSettings };
    const mergedTelegramChatId = updateData.telegramChatId !== undefined ? updateData.telegramChatId : currentUser.telegramChatId;
    const mergedDiscordUrl = updateData.discordWebhookUrl !== undefined ? updateData.discordWebhookUrl : currentUser.discordWebhookUrl;
    const mergedTeamEmails = updateData.teamEmails !== undefined ? updateData.teamEmails : currentUser.teamEmails;

    // 4. Validate Business Rules against merged state
    if (mergedSettings.telegramEnabled && !mergedTelegramChatId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Telegram chat ID is required when Telegram notifications are enabled.");
    }
    
    if (mergedSettings.discordEnabled && !mergedDiscordUrl) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Discord webhook URL is required when Discord notifications are enabled.");
    }
    
    if (mergedSettings.emailEnabled && (!mergedTeamEmails || mergedTeamEmails.length === 0)) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "At least one team email is required when Email notifications are enabled.");
    }

    // 5. Call DAO
    const updatedUser = await updateUserProfileDAO(userId, updateData);
    if (!updatedUser) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    return updatedUser;
};
