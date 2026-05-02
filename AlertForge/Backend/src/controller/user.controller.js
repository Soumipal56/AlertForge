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
