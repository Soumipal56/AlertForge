import Joi from "joi";
import { HTTP_STATUS } from "../config/constants.js";
import ApiError from "../utils/ApiError.js";

export const updateUserProfileSchema = Joi.object({
    name: Joi.string().trim().optional(),
    teamEmails: Joi.array().items(Joi.string().email()).optional().messages({
        "string.email": "One or more emails in teamEmails are invalid."
    }),
    telegramChatId: Joi.string().allow(null, "").optional(),
    discordWebhookUrl: Joi.string().uri().regex(/^https:\/\/discord\.com\/api\/webhooks\//).allow(null, "").optional().messages({
        "string.pattern.base": "Invalid Discord webhook URL format."
    }),
    notificationSettings: Joi.object({
        emailEnabled: Joi.boolean().optional(),
        telegramEnabled: Joi.boolean().optional(),
        discordEnabled: Joi.boolean().optional()
    }).optional()
});

export const validateUserProfileUpdate = (req, res, next) => {
    const { error } = updateUserProfileSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(", ");
        return next(new ApiError(HTTP_STATUS.BAD_REQUEST, errorMessage));
    }
    next();
};
