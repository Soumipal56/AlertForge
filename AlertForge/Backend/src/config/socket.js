import { Server } from "socket.io";
import { hashKey } from "../utils/hashKey.js";
import { findActiveApiKeyByHashedKeyDAO } from "../dao/apikey.dao.js";
import {
    getRecentWarRoomMessages,
    resolveWarRoomIdFromApiKey,
    saveWarRoomMessage,
} from "../services/warroom/warRoomChat.service.js";

let ioInstance = null;

// In-memory presence map:
// roomId -> Set of connected socket IDs currently joined to that room.
const roomPresence = new Map();

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
 * Adds a socket to the presence map for a room and returns the new count.
 * @param {string} socketId
 * @param {string} room
 * @returns {number}
 */
const addPresence = (socketId, room) => {
    if (!roomPresence.has(room)) {
        roomPresence.set(room, new Set());
    }

    roomPresence.get(room).add(socketId);
    return roomPresence.get(room).size;
};

/**
 * Removes a socket from the presence map for a room and returns the new count.
 * @param {string} socketId
 * @param {string} room
 * @returns {number}
 */
const removePresence = (socketId, room) => {
    if (!roomPresence.has(room)) {
        return 0;
    }

    roomPresence.get(room).delete(socketId);
    return roomPresence.get(room).size;
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
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    ioInstance.use(async (socket, next) => {
        try {
            const rawToken = socket.handshake.auth?.token;

            if (!rawToken) {
                return next(new Error("Authentication error: No API key provided"));
            }

            const hashedToken = hashKey(rawToken.trim());
            const apiKey = await findActiveApiKeyByHashedKeyDAO(hashedToken);

            if (!apiKey) {
                return next(new Error("Authentication error: Invalid or inactive API key"));
            }

            socket.data.apiKey = {
                id: apiKey._id?.toString(),
                name: apiKey.name,
                serviceName: apiKey.serviceName,
            };

            return next();
        } catch (err) {
            console.error("[Socket Auth] Middleware error:", err.message);
            return next(new Error("Authentication error: Internal server error"));
        }
    });

    ioInstance.on("connection", (socket) => {
        console.log(`[Socket] Connected: ${socket.id} (key: ${socket.data.apiKey?.name || "unnamed"})`);

        // Existing room join path kept for compatibility with the current app.
        socket.on("join_room", (roomName, ack) => {
            const room = normalizeRoomName(roomName);

            if (!room) {
                if (typeof ack === "function") ack({ success: false, message: "Room name is required" });
                return;
            }

            socket.join(room);
            socket.data.activeRoom = room;

            const count = addPresence(socket.id, room);
            ioInstance.to(room).emit("room:presence", { room, count });

            if (typeof ack === "function") {
                ack({ success: true, room, count });
            }
        });

        socket.on("leave_room", (roomName, ack) => {
            const room = normalizeRoomName(roomName);

            if (!room) {
                if (typeof ack === "function") ack({ success: false, message: "Room name is required" });
                return;
            }

            socket.leave(room);

            if (socket.data.activeRoom === room) {
                socket.data.activeRoom = "";
            }

            const count = removePresence(socket.id, room);
            ioInstance.to(room).emit("room:presence", { room, count });

            if (typeof ack === "function") {
                ack({ success: true, room, count });
            }
        });

        // Explicit War Room entry point.
        // We resolve the room from the API key so the client does not need to
        // pass an extra identifier or authentication payload.
        socket.on("join_warroom", async (_payload, ack) => {
            try {
                const room = resolveWarRoomIdFromApiKey(socket.data.apiKey);

                if (!room) {
                    const message = "War room could not be resolved from API key";
                    if (typeof ack === "function") ack({ success: false, message });
                    socket.emit("chat:error", { message });
                    return;
                }

                socket.join(room);
                socket.data.warRoom = room;

                const count = addPresence(socket.id, room);
                const recentMessages = await getRecentWarRoomMessages(room);

                ioInstance.to(room).emit("room:presence", { room, count });

                if (typeof ack === "function") {
                    ack({
                        success: true,
                        room,
                        count,
                        messages: recentMessages.reverse().map(toMessagePayload),
                    });
                }

                console.log(`[Socket] ${socket.id} joined war room "${room}" (${count} online)`);
            } catch (error) {
                const message = error?.message || "Failed to join war room";
                if (typeof ack === "function") ack({ success: false, message });
                socket.emit("chat:error", { message });
            }
        });

        // Real-time message flow:
        // client -> socket -> MongoDB save -> room-only broadcast.
        socket.on("chat:message", async (payload = {}, ack) => {
            try {
                const room = socket.data.warRoom || resolveWarRoomIdFromApiKey(socket.data.apiKey);
                const content = typeof payload?.content === "string" ? payload.content.trim() : "";

                if (!room) {
                    const message = "Join a war room before sending messages";
                    if (typeof ack === "function") ack({ success: false, message });
                    socket.emit("chat:error", { message });
                    return;
                }

                if (!content) {
                    const message = "Message cannot be empty";
                    if (typeof ack === "function") ack({ success: false, message });
                    socket.emit("chat:error", { message });
                    return;
                }

                if (!socket.rooms.has(room)) {
                    const message = "Socket is not in the war room";
                    if (typeof ack === "function") ack({ success: false, message });
                    socket.emit("chat:error", { message });
                    return;
                }

                const savedMessage = await saveWarRoomMessage({
                    roomId: room,
                    content,
                    apiKey: socket.data.apiKey,
                });

                const messagePayload = toMessagePayload(savedMessage);
                ioInstance.to(room).emit("chat:message", messagePayload);

                if (typeof ack === "function") {
                    ack({ success: true, message: messagePayload });
                }
            } catch (error) {
                const message = error?.message || "Failed to send chat message";
                console.error("[Socket] chat:message error:", message);
                if (typeof ack === "function") ack({ success: false, message });
                socket.emit("chat:error", { message });
            }
        });

        // Keep presence counts in sync when the socket disconnects.
        socket.on("disconnect", (reason) => {
            console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);

            roomPresence.forEach((members, room) => {
                if (members.has(socket.id)) {
                    const count = removePresence(socket.id, room);
                    ioInstance.to(room).emit("room:presence", { room, count });
                }
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
    return roomPresence.get(room)?.size ?? 0;
};
