// FEATURE-4: War Room Controller
import mongoose from "mongoose";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../config/constants.js";
import { 
    getWarRoomHistoryService, 
    sendWarRoomMessageService, 
    toggleWarRoomTaskService 
} from "../services/warroom/warRoom.service.js";
import { emitWarRoomMessage } from "../services/socket/socket.service.js";
import { getIncidentByIdDAO } from "../dao/incident.dao.js";
import { verifyWarRoomToken } from "../utils/warRoomToken.js";

const ALLOWED_JOIN_ROLES = new Set(["admin", "responder", "viewer"]);

const normalizeId = (value) => value?.toString();

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const resolveUserOrganizationId = (user) => {
    return normalizeId(user?.organizationId || user?._id || user?.id);
};

/**
 * GET /api/warroom/:incidentId/join
 * Central access gate for tokenized war-room links.
 */
export const joinWarRoom = async (req, res, next) => {
    const { incidentId } = req.params;
    const joinToken = req.query?.token;
    const authUser = req.currentUser || req.user;
    const userId = normalizeId(authUser?._id || authUser?.id);

    try {
        if (!joinToken) {
            console.warn(`[WarRoomJoin] Failed: missing token for incident ${incidentId}`);
            throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "War-room join token is required");
        }

        let tokenPayload;
        try {
            tokenPayload = verifyWarRoomToken(joinToken);
        } catch (error) {
            console.warn(`[WarRoomJoin] Failed: invalid token for incident ${incidentId}. Reason: ${error.message}`);
            throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid or expired war-room join token");
        }

        if (normalizeId(tokenPayload.incidentId) !== normalizeId(incidentId)) {
            console.warn(`[WarRoomJoin] Failed: URL incident ${incidentId} does not match token incident ${tokenPayload.incidentId}`);
            throw new ApiError(HTTP_STATUS.FORBIDDEN, "War-room token does not match requested incident");
        }

        if (!isValidObjectId(tokenPayload.incidentId) || !isValidObjectId(tokenPayload.organizationId)) {
            console.warn(`[WarRoomJoin] Failed: token contains invalid MongoDB IDs for incident ${incidentId}`);
            throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid war-room token payload");
        }

        const incident = await getIncidentByIdDAO(tokenPayload.incidentId, tokenPayload.organizationId);
        if (!incident) {
            console.warn(`[WarRoomJoin] Failed: incident ${tokenPayload.incidentId} not found for organization ${tokenPayload.organizationId}`);
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "Incident not found");
        }

        if (normalizeId(incident.organizationId) !== normalizeId(tokenPayload.organizationId)) {
            console.warn(`[WarRoomJoin] Failed: incident organization mismatch for incident ${incidentId}`);
            throw new ApiError(HTTP_STATUS.FORBIDDEN, "Incident does not belong to token organization");
        }

        const userOrganizationId = resolveUserOrganizationId(authUser);
        if (!userOrganizationId || userOrganizationId !== normalizeId(tokenPayload.organizationId)) {
            console.warn(`[WarRoomJoin] Failed: user ${userId || "unknown"} does not belong to organization ${tokenPayload.organizationId}`);
            throw new ApiError(HTTP_STATUS.FORBIDDEN, "User does not belong to this war-room organization");
        }

        const role = authUser?.role;
        if (!ALLOWED_JOIN_ROLES.has(role)) {
            console.warn(`[WarRoomJoin] Failed: role denied for user ${userId || "unknown"}. Role: ${role || "missing"}`);
            throw new ApiError(HTTP_STATUS.FORBIDDEN, "User role is not allowed to join this war room");
        }

        console.log(`[WarRoomJoin] Success: user ${userId} joined incident ${incidentId} as ${role}`);

        return res.json(new ApiResponse(HTTP_STATUS.OK, "War room access granted", {
            incident,
            user: {
                id: userId,
                email: authUser.email,
                name: authUser.name,
                organizationId: userOrganizationId
            },
            access: true,
            role,
            warRoomContext: {
                incidentId: normalizeId(incident._id),
                organizationId: normalizeId(incident.organizationId),
                joinToken
            }
        }));
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/warroom/:roomId/messages
 */
export const getWarRoomMessages = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const messages = await getWarRoomHistoryService(roomId, req.user.organizationId);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Messages fetched", messages));
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/warroom/messages
 */
export const sendWarRoomMessage = async (req, res, next) => {
    try {
        const message = await sendWarRoomMessageService(req.body, req.user.organizationId, req.apiKey._id, req.user);
        
        // Broadcast via Socket.IO
        emitWarRoomMessage(message);

        return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, "Message sent", message));
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/warroom/tasks
 */
export const toggleWarRoomTask = async (req, res, next) => {
    try {
        const { messageId, roomId, isCompleted } = req.body;
        const updated = await toggleWarRoomTaskService(messageId, roomId, isCompleted, req.user.organizationId, req.apiKey._id, req.user);
        
        // Broadcast update via Socket.IO
        emitWarRoomMessage(updated);

        return res.json(new ApiResponse(HTTP_STATUS.OK, "Task status updated", updated));
    } catch (error) {
        next(error);
    }
};
