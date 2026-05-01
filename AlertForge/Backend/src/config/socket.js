import { Server } from "socket.io";
import { hashKey } from "../utils/hashKey.js";
import { findActiveApiKeyByHashedKeyDAO } from "../dao/apikey.dao.js";
import {
    getRecentWarRoomMessages,
    resolveWarRoomIdFromApiKey,
    resolveIncidentRoomId,
    saveWarRoomMessage,
    validateWarRoomMessage,
} from "../services/warroom/warRoomChat.service.js";
import { addUser, getCount, removeUser, getRoomsForSocket } from "../services/socket/presence.service.js";
import { getIncidentByIdService } from "../services/incident.service.js";

let ioInstance = null;

/**
 * Normalizes any room input so we always store and compare room names
 * using the same lowercase, trimmed format.
 * @param {string} roomName
 * @returns {string}
 */
const normalizeRoomName = (roomName) => {
    if (typeof roomName !== "string") {
        return "";
    }

    return roomName.trim().toLowerCase();
};

/**
 * Converts a persisted War Room message into the payload we emit to clients.
 * This keeps socket events stable and avoids leaking internal Mongo fields.
 * @param {Object} message
 * @returns {Object}
 */
const toMessagePayload = (message) => ({
    id: message?._id?.toString?.() || message?.id || null,
    roomId: message?.roomId,
    content: message?.content,
    sender: message?.sender,
    createdAt: message?.createdAt,
    updatedAt: message?.updatedAt,
});

/**
 * Emits a standardized socket error event for runtime validation issues.
 * @param {import("socket.io").Socket} socket
 * @param {string} type
 * @param {string} message
 */
const emitSocketError = (socket, type, message) => {
    socket.emit("error:event", { type, message });
};

/**
 * @description Initializes the Socket.io server, attaches auth middleware,
 * and sets up connection / room / chat handlers.
 * @param {import("http").Server} httpServer - The Node.js HTTP server instance.
 * @returns {import("socket.io").Server} The configured Socket.io server instance.
 */
export const initSocket = (httpServer) => {
    ioInstance = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    ioInstance.use(async (socket, next) => {
        try {
            const rawToken = socket.handshake.auth?.token;
            const rawName = socket.handshake.auth?.name;

            if (!rawToken) {
                return next(new Error("Authentication error: No API key provided"));
            }

            const hashedToken = hashKey(rawToken.trim());
            const apiKey = await findActiveApiKeyByHashedKeyDAO(hashedToken);

            if (!apiKey) {
                return next(new Error("Authentication error: Invalid or inactive API key"));
            }

            // Store API key metadata for authorization
            socket.data.apiKey = {
                id: apiKey._id?.toString(),
                name: apiKey.name,
                serviceName: apiKey.serviceName,
            };

            // Store session-based user identity
            socket.data.user = {
                name: typeof rawName === "string" ? rawName.trim() : null,
                nameProvided: !!(typeof rawName === "string" && rawName.trim()),
            };

            return next();
        } catch (err) {
            console.error("[Socket Auth] Middleware error:", err.message);
            return next(new Error("Authentication error: Internal server error"));
        }
    });

    ioInstance.on("connection", (socket) => {
        console.log(`[Socket] Connected: ${socket.id} (key: ${socket.data.apiKey?.name || "unnamed"})`);

        // Explicit War Room entry point.
        // We resolve the room from the API key so the client does not need to
        // pass an extra identifier or authentication payload.
        const handleJoinWarroom = async (_payload, ack) => {
            try {
                const room = normalizeRoomName(resolveWarRoomIdFromApiKey(socket.data.apiKey));

                if (!room) {
                    const message = "War room could not be resolved from API key";
                    if (typeof ack === "function") ack({ success: false, message });
                    emitSocketError(socket, "AUTH_ERROR", message);
                    return;
                }

                socket.join(room);
                socket.data.warRoom = room;

                const count = addUser(room, socket.id);

                // Assign auto-name ONLY if user did not provide one
                if (!socket.data.user.nameProvided) {
                    socket.data.user.name = `User-${count}`;
                }

                const recentMessages = await getRecentWarRoomMessages(room);

                // Notify others that a new user has joined
                socket.to(room).emit("user:joined", { name: socket.data.user.name });

                ioInstance.to(room).emit("room:presence", { room, count });

                if (typeof ack === "function") {
                    ack({
                        success: true,
                        room,
                        count,
                        messages: recentMessages.reverse().map(toMessagePayload),
                    });
                }

                console.log(`[Socket] ${socket.id} (${socket.data.user.name}) joined war room "${room}" (${count} online)`);
            } catch (error) {
                const message = error?.message || "Failed to join war room";
                if (typeof ack === "function") ack({ success: false, message });
                emitSocketError(socket, "VALIDATION_ERROR", message);
            }
        };

        socket.on("join_warroom", handleJoinWarroom);

        /**
         * @description New event handler for joining incident-specific rooms.
         * Validates the incident exists and the user has access via their API key.
         */
        socket.on("join_incident_room", async (payload = {}, ack) => {
            try {
                const { incidentId } = payload;
                if (!incidentId) {
                    throw new Error("Incident ID is required to join an incident room");
                }

                // 1. Fetch the incident to validate it exists.
                const incident = await getIncidentByIdService(incidentId);
                if (!incident) {
                    throw new Error(`Incident with ID ${incidentId} not found`);
                }

                // 2. Security Check: Ensure the incident belongs to this specific API key.
                const userKeyId = socket.data.apiKey?.id;
                const incidentOwnerId = incident.apiKeyId?.toString();

                console.log(`[Socket Auth Debug] Room: join_incident_room`);
                console.log(`[Socket Auth Debug] Incident ID: ${incidentId}`);
                console.log(`[Socket Auth Debug] User API Key ID: ${userKeyId}`);
                console.log(`[Socket Auth Debug] Incident Owner ID: ${incidentOwnerId || "MISSING"}`);

                if (!incident.apiKeyId) {
                    throw new Error("This incident has no owner assigned (legacy data). It cannot be accessed via war room.");
                }

                if (incidentOwnerId !== userKeyId) {
                    console.warn(`[Socket Auth] Unauthorized join attempt. Incident owner: ${incidentOwnerId}, User: ${userKeyId}`);
                    throw new Error("You are not authorized to access this incident's war room");
                }

                // 3. Resolve internal room name and join.
                const room = normalizeRoomName(resolveIncidentRoomId(incidentId));
                socket.join(room);
                
                // Track this as the active room for subsequent chat messages.
                socket.data.activeRoom = room;

                // 4. Update presence and fetch history.
                const count = addUser(room, socket.id);

                // Assign auto-name ONLY if user did not provide one
                if (!socket.data.user.nameProvided) {
                    socket.data.user.name = `User-${count}`;
                }

                const recentMessages = await getRecentWarRoomMessages(room);

                // Notify others that a new user has joined
                socket.to(room).emit("user:joined", { name: socket.data.user.name });

                // Notify all members in the room of new presence count.
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

                console.log(`[Socket] ${socket.id} (${socket.data.user.name}) joined incident room "${room}"`);
            } catch (error) {
                const message = error?.message || "Failed to join incident war room";
                console.error("[Socket] join_incident_room error:", message);
                if (typeof ack === "function") ack({ success: false, message });
                emitSocketError(socket, "VALIDATION_ERROR", message);
            }
        });

        // Real-time message flow:
        // client -> socket -> MongoDB save -> room-only broadcast.
        socket.on("chat:message", async (payload = {}, ack) => {
            try {
                // Priority: activeRoom (incident-specific) -> warRoom (service-level fallback) -> API key derived room.
                const room = socket.data.activeRoom || socket.data.warRoom || normalizeRoomName(resolveWarRoomIdFromApiKey(socket.data.apiKey));
                const validation = validateWarRoomMessage(payload?.content);

                if (!room) {
                    const message = "Join a war room before sending messages";
                    if (typeof ack === "function") ack({ success: false, message });
                    emitSocketError(socket, "VALIDATION_ERROR", message);
                    return;
                }

                if (!validation.valid) {
                    const message = validation.message || "Invalid message";
                    if (typeof ack === "function") ack({ success: false, message });
                    emitSocketError(socket, "VALIDATION_ERROR", message);
                    return;
                }

                if (!socket.rooms.has(room)) {
                    const message = "Socket is not in the war room";
                    if (typeof ack === "function") ack({ success: false, message });
                    emitSocketError(socket, "VALIDATION_ERROR", message);
                    return;
                }

                // Security: Prevent messages in resolved incidents (read-only mode)
                if (room.startsWith("incident:")) {
                    const incidentId = room.split(":")[1];
                    const incident = await getIncidentByIdService(incidentId);
                    
                    if (incident && incident.status === "resolved") {
                        const message = "This incident is resolved. Chat is read-only.";
                        if (typeof ack === "function") ack({ success: false, message });
                        emitSocketError(socket, "FORBIDDEN", message);
                        return;
                    }
                }

                const savedMessage = await saveWarRoomMessage({
                    roomId: room,
                    content: validation.value,
                    apiKey: socket.data.apiKey,
                    user: socket.data.user,
                });

                const messagePayload = toMessagePayload(savedMessage);
                ioInstance.to(room).emit("chat:message", messagePayload);
                console.log(`[Socket] chat:message room=${room} socket=${socket.id}`);

                if (typeof ack === "function") {
                    ack({ success: true, message: messagePayload });
                }
            } catch (error) {
                const message = error?.message || "Failed to send chat message";
                console.error("[Socket] chat:message error:", message);
                if (typeof ack === "function") ack({ success: false, message });
                emitSocketError(socket, "VALIDATION_ERROR", message);
            }
        });

        // Legacy alias kept so older clients do not break.
        // We immediately route it through the canonical war room join.
        socket.on("join_room", (roomName, ack) => {
            console.log(`[Socket] join_room is deprecated; routing to join_warroom (${normalizeRoomName(roomName) || "api-key room"})`);
            return handleJoinWarroom(null, ack);
        });

        // Keep presence counts in sync when the socket disconnects.
        socket.on("disconnect", (reason) => {
            console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
            const rooms = getRoomsForSocket(socket.id);

            rooms.forEach((room) => {
                const count = removeUser(room, socket.id);
                ioInstance.to(room).emit("user:left", { name: socket.data.user?.name || "Anonymous" });
                ioInstance.to(room).emit("room:presence", { room, count });
            });
        });
    });

    return ioInstance;
};

export const getIo = () => ioInstance;

/**
 * @description Returns the current number of connected sockets in a given room.
 * @param {string} roomName
 * @returns {number}
 */
export const getRoomPresenceCount = (roomName) => {
    const room = normalizeRoomName(roomName);
    return getCount(room);
};
