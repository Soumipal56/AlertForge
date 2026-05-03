import apiKeyModel from "../model/ApiKey.model.js";

export const createApiKeyDAO = async (data) => {
    return await apiKeyModel.create(data);
};

export const findActiveApiKeyByKeyIdDAO = async (keyId) => {
    return await apiKeyModel
        .findOne({
            keyId: keyId,
            isActive: true,
        })
        .select("+hashedKey") // Explicitly select since it's hidden by default
        .populate("user")
        .lean();
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

// FEATURE-7: List all active keys for a user (excludes sensitive data)
export const findApiKeysByUserDAO = async (userId) => {
    return await apiKeyModel
        .find({ user: userId, isActive: true })
        .select("-hashedKey")
        .sort({ createdAt: -1 })
        .lean();
};

// FEATURE-7: Soft-delete a specific key by ID, scoped to owner
export const deactivateApiKeyByIdDAO = async (keyId, userId) => {
    return await apiKeyModel.findOneAndUpdate(
        { _id: keyId, user: userId },
        { $set: { isActive: false } },
        { returnDocument: "after" }
    );
};
