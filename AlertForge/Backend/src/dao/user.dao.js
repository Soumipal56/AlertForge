import User from "../model/User.model.js";

export const createUserDAO = async (data) => {
    return await User.create(data);
};

export const findUserByEmailDAO = async (email) => {
    return await User.findOne({ email });
};

export const findUserByEmailWithPasswordDAO = async (email) => {
    return await User.findOne({ email }).select("+password");
};

export const findUserByIdDAO = async (userId) => {
    return await User.findById(userId);
};

export const updateUserByIdDAO = async (userId, updates) => {
    return await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
    );
};

export const findUserByClerkIdDAO = async (clerkId) => {
    return await User.findOne({ clerkId });
};

export const updateUserByClerkIdDAO = async (clerkId, updates) => {
    return await User.findOneAndUpdate(
        { clerkId },
        { $set: updates },
        { new: true, runValidators: true, upsert: true }
    );
};
