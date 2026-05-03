// User DAO — handles all user-level DB operations
import userModel from "../model/User.model.js";

/**
 * Creates a new user document.
 */
export const createUserDAO = async (data) => {
    return await userModel.create(data);
};

/**
 * Finds a user by email — does NOT include password (use findUserByEmailWithPasswordDAO for auth).
 */
export const findUserByEmailDAO = async (email) => {
    return await userModel.findOne({ email }).lean();
};

/**
 * Finds a user by email WITH password field selected — for login/auth only.
 */
export const findUserByEmailWithPasswordDAO = async (email) => {
    return await userModel.findOne({ email }).select("+password");
};

/**
 * Finds a user by their MongoDB _id.
 */
export const findUserByIdDAO = async (id) => {
    return await userModel.findById(id).lean();
};

/**
 * Finds a user by their Google OAuth ID.
 */
export const findUserByGoogleIdDAO = async (googleId) => {
    return await userModel.findOne({ googleId }).lean();
};

/**
 * FEATURE-8: Finds all team members that belong to an organization (admin's userId).
 * @param {string} organizationId - The admin's userId
 */
export const getTeamMembersDAO = async (organizationId) => {
    return await userModel
        .find({ organizationId })
        .select("-password")
        .lean();
};

/**
 * FEATURE-8: Finds a team member by email within an organization.
 */
export const findTeamMemberByEmailDAO = async (email, organizationId) => {
    return await userModel.findOne({ email, organizationId }).lean();
};

/**
 * FEATURE-10: Updates a user's role (admin/responder/viewer).
 */
export const updateUserRoleDAO = async (userId, organizationId, role) => {
    return await userModel.findOneAndUpdate(
        { _id: userId, organizationId },
        { $set: { role } },
        { returnDocument: "after" }
    ).lean();
};

/**
 * FEATURE-8: Removes a team member from the organization.
 */
export const removeTeamMemberDAO = async (userId, organizationId) => {
    return await userModel.findOneAndDelete({ _id: userId, organizationId });
};

/**
 * Updates a user document by ID.
 */
export const updateUserDAO = async (id, updates) => {
    return await userModel.findByIdAndUpdate(id, { $set: updates }, { returnDocument: "after" }).lean();
};

/**
 * Alias used by auth.service.js — updates user by ID.
 */
export const updateUserByIdDAO = async (id, updates) => {
    return await userModel.findByIdAndUpdate(id, { $set: updates }, { returnDocument: "after", new: true }).lean();
};
