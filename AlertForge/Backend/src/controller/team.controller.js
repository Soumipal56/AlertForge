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
} from "../dao/user.dao.js";

/**
 * GET /api/team/members
 * Returns all members belonging to the admin's organization.
 */
export const getTeamMembers = async (req, res, next) => {
    try {
        const organizationId = req.user?.userId;
        const members = await getTeamMembersDAO(organizationId);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Team members fetched", members));
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/team/invite
 * Invites a new team member by creating their account linked to the admin's organization.
 * Body: { name, email, password, role }
 */
export const inviteTeamMember = async (req, res, next) => {
    try {
        const organizationId = req.user?.userId;
        const { name, email, password, role } = req.body;

        if (!email || !password) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Email and password are required");
        }

        // Check for duplicate email
        const existing = await findUserByEmailDAO(email);
        if (existing) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "A user with this email already exists");
        }

        const validRoles = ["responder", "viewer"];
        const memberRole = validRoles.includes(role) ? role : "responder";

        const hashedPassword = await bcrypt.hash(password, 12);
        const member = await createUserDAO({
            name,
            email: email.trim().toLowerCase(),
            emailAddress: email.trim().toLowerCase(),
            password: hashedPassword,
            role: memberRole,
            organizationId,
        });

        return res.status(HTTP_STATUS.CREATED).json(
            new ApiResponse(HTTP_STATUS.CREATED, "Team member invited successfully", {
                id: member._id,
                email: member.email,
                role: member.role,
                name: member.name,
            })
        );
    } catch (error) {
        next(error);
    }
};


/**
 * PATCH /api/team/role
 * Updates a team member's role.
 * Body: { memberId, role }
 * Only admin can change roles.
 */
export const updateTeamMemberRole = async (req, res, next) => {
    try {
        const organizationId = req.user?.userId;
        const { memberId, role } = req.body;

        const validRoles = ["responder", "viewer"];
        if (!validRoles.includes(role)) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Role must be 'responder' or 'viewer'");
        }

        const updated = await updateUserRoleDAO(memberId, organizationId, role);
        if (!updated) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "Team member not found");
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
        const organizationId = req.user?.userId;
        const result = await removeTeamMemberDAO(req.params.id, organizationId);
        if (!result) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "Team member not found");
        }
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Team member removed"));
    } catch (error) {
        next(error);
    }
};
