import { Server } from "socket.io";
import { findActiveApiKeyByHashedKeyDAO } from "../dao/apikey.dao.js";
import { findUserByIdDAO } from "../dao/user.dao.js";
import { verifyAccessToken } from "../utils/token.js";
import { hashKey } from "../utils/hashKey.js";
import {
    getRecentWarRoomMessages,
    resolveWarRoomIdFromApiKey,
    resolveIncidentRoomId,
    saveWarRoomMessage,
    validateWarRoomMessage,
} from "../services/warroom/warRoomChat.service.js";
import { addUser, getCount, removeUser, getRoomsForSocket } from "../services/socket/presence.service.js";
import { getIncidentByIdService } from "../services/incident.service.js";
import { setupRedisAdapter } from "./redis.adapter.js";
import { socketConnectionLimiter, throttleSocketEvent, rateLimitConfig } from "../middleware/rateLimiter/index.js";
import { storeChatInPinecone } from "../services/ai/utils/pinecone.js";
import { getWarRoomSuggestions } from "../services/ai/suggestion.service.js";

let ioInstance = null;

/**
 * Normalizes any room input so we always store and compare room names
 * using the same lowercase, trimmed format.
 */
const normalizeRoomName = (roomName) => {
    if (typeof roomName !== "string") return "";
    return roomName.trim().toLowerCase();
};

/**
 * Converts a persisted War Room message into the payload we emit to clients.
 */
const toMessagePayload = (message) => ({
    id: message?._id?.toString?.() || message?.id || null,
    roomId: message?.roomId,
    content: message?.content,
    fileUrl: message?.fileUrl,
    fileType: message?.fileType,
    sender: {
        apiKeyId: message?.sender?.apiKeyId || null,
        name: message?.sender?.name || "Unknown",
        serviceName: message?.sender?.serviceName || "",
    },
    createdAt: message?.createdAt,
});

/**
 * Emits a standardized socket error event.
 */
const emitSocketError = (socket, type, message) => {
    socket.emit("error:event", { type, message });
};

export const initSocket = async (httpServer) => {
    ioInstance = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    await setupRedisAdapter(ioInstance);
    ioInstance.use(socketConnectionLimiter);

    /**
     * @description Middleware to authenticate socket connections using ONLY an API key.
     * Replaces Clerk/JWT/Cookie logic completely.
     */
    ioInstance.use(async (socket, next) => {
        try {
            const { apiKey, token, name } = socket.handshake.auth;

            if (apiKey) {
                const hashed = hashKey(apiKey);
                const foundKey = await findActiveApiKeyByHashedKeyDAO(hashed);

                if (!foundKey) {
                    return next(new Error("Unauthorized: Invalid or inactive API Key"));
                }

                socket.user = {
                    organizationId: foundKey.user?.organizationId?.toString() || foundKey.user?._id?.toString(),
                    apiKeyId: foundKey._id?.toString(),
                    userId: foundKey.user?._id?.toString(),
                    serviceName: foundKey.serviceName,
                    name: typeof name === "string" && name.trim() ? name.trim() : `User-${socket.id.slice(0, 4)}`,
                };
                
                socket.data.apiKey = { id: foundKey._id?.toString(), name: foundKey.name, serviceName: foundKey.serviceName };
                socket.data.user = socket.user;
                return next();
            }

            if (token) {
                try {
                    const decoded = verifyAccessToken(token);
                    if (!decoded?.userId) throw new Error("Invalid token");

                    // For JWT flow, we still need the orgId and other metadata
                    // We'll fetch a default API key or just the user record
                    const user = await findUserByIdDAO(decoded.userId);
                    if (!user) throw new Error("User not found");

                    socket.user = {
                        organizationId: user.organizationId?.toString() || user._id?.toString(),
                        userId: user._id?.toString(),
                        name: user.name || `User-${socket.id.slice(0, 4)}`,
                        role: user.role
                    };
                    socket.data.user = socket.user;
                    return next();
                } catch (err) {
                    return next(new Error("Unauthorized: Invalid or expired token"));
                }
            }

            return next(new Error("Unauthorized: Authentication required"));
        } catch (err) {
            console.error("[Socket Auth] Middleware error:", err.message);
            return next(new Error("Unauthorized: Internal server error"));
        }
    });

    ioInstance.on("connection", (socket) => {
        console.log(`[Socket] Connected: ${socket.id} (user: ${socket.user.name})`);

        /**
         * @description Unified room joining (for service or incident)
         */
        socket.on("room:join", async (payload = {}, ack) => {
            try {
                const { roomType, id } = payload; // roomType: 'service' | 'incident'
                let room = "";

                if (roomType === "service") {
                    room = normalizeRoomName(socket.user.serviceName);
                } else if (roomType === "incident") {
                    if (!id) throw new Error("Incident ID required");
                    const incident = await getIncidentByIdService(id, socket.user.organizationId); 
                    if (!incident) throw new Error("Incident not found/unauthorized");
                    room = normalizeRoomName(`incident:${id}`);
                } else {
                    throw new Error("Invalid room type");
                }

                socket.join(room);
                socket.data.activeRoom = room;

                const count = await addUser(room, socket.id);
                const recentMessages = await getRecentWarRoomMessages(room, socket.user.organizationId);

                // Broadcast presence update
                ioInstance.to(room).emit("presence:update", { room, count, user: socket.user });

                if (typeof ack === "function") {
                    ack({
                        success: true,
                        room,
                        count,
                        messages: recentMessages.reverse().map(toMessagePayload),
                    });
                }

                // AI Suggestions Trigger
                if (room.startsWith("incident:")) {
                    const incidentId = room.split(":")[1];
                    const incident = await getIncidentByIdService(incidentId, socket.user.apiKeyId);
                    if (incident) {
                        getWarRoomSuggestions(incident).then(suggestions => {
                            socket.emit("room:suggestion", { suggestions });
                        }).catch(err => console.error("[Socket] Suggestion error:", err.message));
                    }
                }
            } catch (error) {
                if (typeof ack === "function") ack({ success: false, message: error.message });
                emitSocketError(socket, "JOIN_ERROR", error.message);
            }
        });

        /**
         * @description Leaves a room explicitly
         */
        socket.on("join_incident_room", async (payload = {}, ack) => {
            try {
                const { incidentId } = payload;
                if (!incidentId) throw new Error("Incident ID is required");

                // Validate incident access using Organization ID
                const incident = await getIncidentByIdService(incidentId, socket.user.organizationId);
                if (!incident) throw new Error("Incident not found or unauthorized");

                const room = normalizeRoomName(`incident:${incidentId}`);
                socket.join(room);
                socket.data.activeRoom = room;

                const count = await addUser(room, socket.id);
                const recentMessages = await getRecentWarRoomMessages(room, socket.user.organizationId);

                // Broadcast presence
                ioInstance.to(room).emit("room:presence", { room, count });

                if (typeof ack === "function") {
                    ack({
                        success: true,
                        room,
                        count,
                        messages: recentMessages.reverse().map(toMessagePayload),
                        status: incident.status,
                    });
                }

                // AI Suggestions Trigger
                getWarRoomSuggestions(incident).then(suggestions => {
                    socket.emit("room:suggestion", { suggestions });
                }).catch(err => console.error("[Socket] Suggestion error:", err.message));
            } catch (error) {
                if (typeof ack === "function") ack({ success: false, message: error.message });
                emitSocketError(socket, "VALIDATION_ERROR", error.message);
            }
        });

        socket.on("room:leave", (payload = {}, ack) => {
            const { room } = payload;
            if (room) {
                socket.leave(room);
                const count = removeUser(room, socket.id);
                ioInstance.to(room).emit("presence:update", { room, count, user: socket.user, action: "left" });
                if (typeof ack === "function") ack({ success: true });
            }
        });

        /**
         * @description Standardized message event
         */
        socket.on("message:new", async (payload = {}, ack) => {
            try {
                const room = socket.data.activeRoom;
                if (!room) throw new Error("Not in a room");

                const savedMessage = await saveWarRoomMessage({
                    roomId: room,
                    content: payload?.content,
                    fileUrl: payload?.fileUrl,
                    fileType: payload?.fileType,
                    apiKey: socket.data.apiKey,
                    user: socket.user,
                });

                const messagePayload = toMessagePayload(savedMessage);
                ioInstance.to(room).emit("message:new", messagePayload);

                if (room.startsWith("incident:")) {
                    const incidentId = room.split(":")[1];
                    storeChatInPinecone([savedMessage], incidentId).catch(console.error);
                }

                if (typeof ack === "function") ack({ success: true, message: messagePayload });
            } catch (error) {
                if (typeof ack === "function") ack({ success: false, message: error.message });
                emitSocketError(socket, "MESSAGE_ERROR", error.message);
            }
        });

        /**
         * @description Task status update event
         */
        socket.on("task:update", async (payload = {}, ack) => {
            try {
                const { messageId, isCompleted } = payload;
                const room = socket.data.activeRoom;
                if (!room) throw new Error("Not in a room");

                // Broadcast update to the room
                ioInstance.to(room).emit("task:update", { messageId, isCompleted, updatedBy: socket.user.name });

                if (typeof ack === "function") ack({ success: true });
            } catch (error) {
                if (typeof ack === "function") ack({ success: false, message: error.message });
                emitSocketError(socket, "TASK_ERROR", error.message);
            }
        });

        socket.on("disconnect", async () => {
            const rooms = await getRoomsForSocket(socket.id);
            for (const room of rooms) {
                const count = await removeUser(room, socket.id);
                ioInstance.to(room).emit("room:presence", { room, count });
            }
        });
    });

    
    return ioInstance;

};

export const getIo = () => ioInstance;
export const getRoomPresenceCount = async (roomName) => getCount(normalizeRoomName(roomName));

