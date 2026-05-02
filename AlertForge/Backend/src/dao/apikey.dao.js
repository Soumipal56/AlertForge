import apiKeyModel from "../model/ApiKey.model.js";

export const createApiKeyDAO = async (data) => {
    return await apiKeyModel.create(data);
};

export const findActiveApiKeyByUserDAO = async (userId) => {
    return await apiKeyModel
        .findOne({
            user: userId,
            isActive: true,
        })
        .populate("user")
        .lean();
};

export const deactivateActiveApiKeysByUserDAO = async (userId) => {
    return await apiKeyModel.updateMany(
        {
            user: userId,
            isActive: true,
        },
        {
            $set: { isActive: false },
        }
    );
};
