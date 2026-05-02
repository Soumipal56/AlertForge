import User from "../model/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * @description Get notification settings for a user
 */
export const getUserSettings = async (req, res, next) => {
    try {
        const { clerkId } = req.params; // Or req.auth.userId if using Clerk middleware
        
        let settings = await User.findOne({ clerkId });
        
        if (!settings) {
            // Create default settings if they don't exist
            settings = await User.create({ clerkId });
        }

        return res.json(new ApiResponse(HTTP_STATUS.OK, "Settings fetched", settings));
    } catch (error) {
        next(error);
    }
};

/**
 * @description Update notification settings for a user
 */
export const updateUserSettings = async (req, res, next) => {
    try {
        const { clerkId } = req.params;
        const updates = req.body;

        const settings = await User.findOneAndUpdate(
            { clerkId },
            { $set: updates },
            { new: true, upsert: true }
        );

        return res.json(new ApiResponse(HTTP_STATUS.OK, "Settings updated successfully", settings));
    } catch (error) {
        next(error);
    }
};
