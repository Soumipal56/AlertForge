import { Server } from "socket.io";
import { hashKey } from "../utils/hashKey.js";
import { findActiveApiKeyByHashedKeyDAO } from "../dao/apikey.dao.js";

let ioInstance = null;

// In-memory presence map: roomName -> Set of socket IDs
const roomPresence = new Map();

/**
 * @description Initializes the Socket.io server, attaches auth middleware,
 * and sets up connection / join_room / disconnect event handlers.
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

    // ─── Auth Middleware ───────────────────────────────────────────────────────
    // Runs before the "connection" event fires. If no valid API key is found the
    // handshake is rejected and the client never gets a socket.id.
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

            // Attach key metadata to the socket so handlers can read it later
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

    // ─── Connection Handler ────────────────────────────────────────────────────
    ioInstance.on("connection", (socket) => {
        console.log(`[Socket] Connected: ${socket.id} (key: ${socket.data.apiKey?.name || "unnamed"})`);

        // ── join_room ──────────────────────────────────────────────────────────
        // Clients emit this to scope themselves to a specific service War Room.
        // Example: socket.emit("join_room", "payment-gateway")
        socket.on("join_room", (roomName) => {
            if (typeof roomName !== "string" || !roomName.trim()) return;

            const room = roomName.trim().toLowerCase();
            socket.join(room);

            // Track presence
            if (!roomPresence.has(room)) {
                roomPresence.set(room, new Set());
            }
            roomPresence.get(room).add(socket.id);

            const count = roomPresence.get(room).size;
            console.log(`[Socket] ${socket.id} joined room "${room}" (${count} online)`);

            // Broadcast updated presence count to everyone in the room
            ioInstance.to(room).emit("room:presence", { room, count });
        });

        // ── leave_room ─────────────────────────────────────────────────────────
        socket.on("leave_room", (roomName) => {
            if (typeof roomName !== "string" || !roomName.trim()) return;

            const room = roomName.trim().toLowerCase();
            socket.leave(room);

            if (roomPresence.has(room)) {
                roomPresence.get(room).delete(socket.id);
                const count = roomPresence.get(room).size;
                ioInstance.to(room).emit("room:presence", { room, count });
                console.log(`[Socket] ${socket.id} left room "${room}" (${count} online)`);
            }
        });

        // ── Disconnect: clean up all rooms this socket was in ─────────────────
        socket.on("disconnect", (reason) => {
            console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);

            roomPresence.forEach((members, room) => {
                if (members.has(socket.id)) {
                    members.delete(socket.id);
                    ioInstance.to(room).emit("room:presence", { room, count: members.size });
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
    const room = roomName?.trim().toLowerCase();
    return roomPresence.get(room)?.size ?? 0;
};

