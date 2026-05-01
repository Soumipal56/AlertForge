import apiKeyModel from "../model/ApiKey.model.js";

export const createApiKeyDAO = async (data) => {
    return await apiKeyModel.create(data);
};

export const findActiveApiKeyByHashedKeyDAO = async (hashedKey) => {
    return await apiKeyModel.findOne({
        key: hashedKey,
        isActive: true,
    }).lean();
};
