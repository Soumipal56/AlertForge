import { Server } from "socket.io";
import { findActiveApiKeyByHashedKeyDAO } from "../dao/apikey.dao.js";
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
            const { apiKey, name } = socket.handshake.auth;

            if (!apiKey) {
                return next(new Error("Unauthorized: API Key is required"));
            }

            const hashed = hashKey(apiKey);
            const foundKey = await findActiveApiKeyByHashedKeyDAO(hashed);

            if (!foundKey) {
                return next(new Error("Unauthorized: Invalid or inactive API Key"));
            }

            // Attach validated user info to the socket
            socket.user = {
                apiKeyId: foundKey._id?.toString(),
                serviceName: foundKey.serviceName,
                name: typeof name === "string" && name.trim() ? name.trim() : `User-${socket.id.slice(0, 4)}`,
            };

            // Keep socket.data for internal compatibility if needed
            socket.data.apiKey = {
                id: foundKey._id?.toString(),
                name: foundKey.name,
                serviceName: foundKey.serviceName,
            };
            socket.data.user = socket.user;

            return next();
        } catch (err) {
            console.error("[Socket Auth] Middleware error:", err.message);
            return next(new Error("Unauthorized: Internal server error"));
        }
    });

    ioInstance.on("connection", (socket) => {
        console.log(`[Socket] Connected: ${socket.id} (user: ${socket.user.name}, service: ${socket.user.serviceName})`);

        /**
         * @description Joins the global war room for the service.
         */
        socket.on("join_warroom", async (_payload, ack) => {
            try {
                if (!await throttleSocketEvent(socket, "join_room", rateLimitConfig.socket.join)) return;

                const room = normalizeRoomName(socket.user.serviceName);
                if (!room) throw new Error("War room could not be resolved");

                socket.join(room);
                socket.data.activeRoom = room;

                const count = addUser(room, socket.id);
                const recentMessages = await getRecentWarRoomMessages(room);

                // Broadcast presence
                ioInstance.to(room).emit("room:presence", { room, count });

                if (typeof ack === "function") {
                    ack({
                        success: true,
                        room,
                        count,
                        messages: recentMessages.reverse().map(toMessagePayload),
                    });
                }
            } catch (error) {
                if (typeof ack === "function") ack({ success: false, message: error.message });
                emitSocketError(socket, "VALIDATION_ERROR", error.message);
            }
        });

        /**
         * @description Joins an incident-specific war room.
         */
        socket.on("join_incident_room", async (payload = {}, ack) => {
            try {
                const { incidentId } = payload;
                if (!incidentId) throw new Error("Incident ID is required");

                // Validate incident access using API key ID
                const incident = await getIncidentByIdService(incidentId, socket.user.apiKeyId);
                if (!incident) throw new Error("Incident not found or unauthorized");

                const room = normalizeRoomName(`incident:${incidentId}`);
                socket.join(room);
                socket.data.activeRoom = room;

                const count = addUser(room, socket.id);
                const recentMessages = await getRecentWarRoomMessages(room);

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
            } catch (error) {
                if (typeof ack === "function") ack({ success: false, message: error.message });
                emitSocketError(socket, "VALIDATION_ERROR", error.message);
            }
        });

        /**
         * @description Handles real-time chat messages.
         */
        socket.on("chat:message", async (payload = {}, ack) => {
            try {
                if (!await throttleSocketEvent(socket, "chat:message", rateLimitConfig.socket.message)) return;

                const room = socket.data.activeRoom;
                if (!room || !socket.rooms.has(room)) throw new Error("Join a room first");

                const validation = validateWarRoomMessage(payload?.content);
                if (!validation.valid && !payload?.fileUrl) throw new Error(validation.message || "Invalid message");

                const savedMessage = await saveWarRoomMessage({
                    roomId: room,
                    content: payload?.content,
                    fileUrl: payload?.fileUrl,
                    fileType: payload?.fileType,
                    apiKey: socket.data.apiKey,
                    user: socket.user,
                });

                const messagePayload = toMessagePayload(savedMessage);
                ioInstance.to(room).emit("chat:message", messagePayload);

                if (room.startsWith("incident:")) {
                    const incidentId = room.split(":")[1];
                    storeChatInPinecone([savedMessage], incidentId).catch(console.error);
                }

                if (typeof ack === "function") ack({ success: true, message: messagePayload });
            } catch (error) {
                if (typeof ack === "function") ack({ success: false, message: error.message });
                emitSocketError(socket, "VALIDATION_ERROR", error.message);
            }
        });

        socket.on("disconnect", () => {
            const rooms = getRoomsForSocket(socket.id);
            rooms.forEach((room) => {
                const count = removeUser(room, socket.id);
                ioInstance.to(room).emit("room:presence", { room, count });
            });
        });
    });

    return ioInstance;
};

export const getIo = () => ioInstance;
export const getRoomPresenceCount = (roomName) => getCount(normalizeRoomName(roomName));
