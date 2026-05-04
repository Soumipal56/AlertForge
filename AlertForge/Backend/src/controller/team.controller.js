// FEATURE-8: Team System + FEATURE-10: RBAC Controller
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../config/constants.js";
import bcrypt from "bcryptjs";
import {
    getTeamMembersDAO,
    updateUserRoleDAO,
    removeTeamMemberDAO,
    createUserDAO,
    findUserByEmailDAO,
    findUserByIdDAO,
} from "../dao/user.dao.js";
import { sendInviteEmail } from "../services/notification/email.service.js";

/**
 * GET /api/team/members
 * Returns all members belonging to the admin's organization.
 */
export const getTeamMembers = async (req, res, next) => {
    try {
        const organizationId = req.user.organizationId;
        const members = await getTeamMembersDAO(organizationId);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Team members fetched", members));
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/team/invite
 * Invites a new team member. If no password provided, defaults to 'AlertForge123!'.
 * Body: { name, email, password, role }
 */
export const inviteTeamMember = async (req, res, next) => {
    try {
        const organizationId = req.user.organizationId;
        const { name, email, password, role } = req.body;

        if (!email) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Email is required");
        }

        // Check for duplicate email across the entire system
        const existing = await findUserByEmailDAO(email.trim().toLowerCase());
        if (existing) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "A user with this email already exists");
        }

        const validRoles = ["responder", "viewer"];
        const memberRole = validRoles.includes(role) ? role : "responder";

        // Default password if not provided — hashing is handled by User.model.js pre-save hook
        const finalPassword = password || "AlertForge123!";
        // Default name to email prefix if not provided
        const finalName = name || email.split("@")[0];

        const member = await createUserDAO({
            name: finalName,
            email: email.trim().toLowerCase(),
            password: finalPassword, // Model will hash this
            role: memberRole,
            organizationId,
        });

        // Fetch inviter's name for a personalized email
        const inviter = await findUserByIdDAO(req.user.id);
        const inviterName = inviter?.name || "Your Team Lead";

        // Send invitation email asynchronously
        sendInviteEmail({
            to: member.email,
            name: member.name,
            temporaryPassword: finalPassword,
            invitedBy: inviterName,
        }).catch(err => console.error("[InviteEmail] Background error:", err.message));

        return res.status(HTTP_STATUS.CREATED).json(
            new ApiResponse(HTTP_STATUS.CREATED, "Team member invited successfully", {
                id: member._id,
                email: member.email,
                role: member.role,
                name: member.name,
                temporaryPassword: password ? undefined : "AlertForge123!",
            })
        );
    } catch (error) {
        // If it's a Mongoose validation error, return 400
        if (error.name === "ValidationError") {
            return next(new ApiError(HTTP_STATUS.BAD_REQUEST, error.message));
        }
        next(error);
    }
};

/**
 * PATCH /api/team/role
 * Updates a team member's role.
 * Body: { userId, role }
 */
export const updateTeamMemberRole = async (req, res, next) => {
    try {
        const organizationId = req.user.organizationId;
        const { userId, memberId, role } = req.body;
        const targetId = userId || memberId;

        if (!targetId) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Member ID (userId) is required");
        }

        // Prevent admin from changing their own role in the team management route
        if (targetId === organizationId) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "You cannot change your own organization role here.");
        }

        const validRoles = ["responder", "viewer"];
        if (!validRoles.includes(role)) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Role must be 'responder' or 'viewer'");
        }

        const updated = await updateUserRoleDAO(targetId, organizationId, role);
        if (!updated) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "Team member not found in your organization");
        }

        return res.json(new ApiResponse(HTTP_STATUS.OK, "Role updated", updated));

    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/team/member/:id
 * Removes a team member from the organization.
 * Only admin can remove members.
 */
export const removeTeamMember = async (req, res, next) => {
    try {
        const organizationId = req.user.organizationId;
        const result = await removeTeamMemberDAO(req.params.id, organizationId);
        if (!result) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "Team member not found");
        }
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Team member removed"));
    } catch (error) {
        next(error);
    }
};
/**
 * POST /api/team/resend-invite
 * Resends the invitation email to a pending member.
 */
export const resendInvite = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Email is required");

        const user = await findUserByEmailDAO(email);
        if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");

        const inviter = await findUserByIdDAO(req.user.organizationId);
        const inviterName = inviter?.name || "Your Team Lead";

        await sendInviteEmail({
            to: user.email,
            name: user.name,
            temporaryPassword: "AlertForge123!", // Standard default for now
            invitedBy: inviterName,
        });

        return res.json(new ApiResponse(HTTP_STATUS.OK, "Invitation resent"));
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/team/revoke-invite/:email
 * Revokes an invitation by deleting the user record.
 */
export const revokeInvite = async (req, res, next) => {
    try {
        const { email } = req.params;
        const user = await findUserByEmailDAO(email);

        if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Invitation not found");
        if (user.organizationId.toString() !== req.user.organizationId.toString()) {
            throw new ApiError(HTTP_STATUS.FORBIDDEN, "Unauthorized to revoke this invitation");
        }

        await removeTeamMemberDAO(user._id, req.user.organizationId);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Invitation revoked"));
    } catch (error) {
        next(error);
    }
};
