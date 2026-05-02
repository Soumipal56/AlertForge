// FEATURE-10: RBAC Middleware
// Enforces role-based access control after smartAuth has set req.user
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../config/constants.js";
import { findUserByIdDAO } from "../dao/user.dao.js";

/**
 * Role hierarchy:
 *   admin      → full access
 *   responder  → incidents + war room (read/write)
 *   viewer     → read-only access only
 *
 * Usage: router.patch("/...", smartAuth, requireRole("admin"), handler)
 *        router.get("/...", smartAuth, requireRole("viewer"), handler)  // viewer = any authenticated user
 */
export const requireRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authentication required");
            }

            // Fetch fresh user to get current role (avoids stale JWT role claims)
            const user = await findUserByIdDAO(userId);
            if (!user) {
                throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "User not found");
            }

            // Attach full user to req for downstream use
            req.currentUser = user;

            if (!allowedRoles.includes(user.role)) {
                throw new ApiError(
                    HTTP_STATUS.FORBIDDEN,
                    `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${user.role}`
                );
            }

            return next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Shorthand middleware: admin only
 */
export const adminOnly = requireRole("admin");

/**
 * Shorthand middleware: admin or responder (incident handlers)
 */
export const responderOrAbove = requireRole("admin", "responder");

/**
 * Shorthand middleware: any authenticated user (viewers included)
 */
export const anyRole = requireRole("admin", "responder", "viewer");
