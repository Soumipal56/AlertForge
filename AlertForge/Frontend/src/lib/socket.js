import { io } from "socket.io-client";
import { BASE_URL } from "./apiClient";

/**
 * Production-ready Socket.io client for AlertForge.
 *
 * Authentication: API Key passed via socket.handshake.auth.apiKey
 * The backend validates this against the DB on every connection attempt.
 */

let socketInstance = null;
let currentApiKey = "";

// ── Core lifecycle ─────────────────────────────────────────────────────────

/**
 * Initialize (or return existing) socket connection.
 * @param {string} apiKey   — raw API key for socket auth
 * @param {string} name     — display name for this connection
 */
export const initSocket = (apiKey = "", name = "") => {
    const key = typeof apiKey === "string" ? apiKey.trim() : "";
    const displayName = typeof name === "string" ? name.trim() : "";

    // Return existing if same key + already connected
    if (socketInstance?.connected && key === currentApiKey) {
        return socketInstance;
    }

    // Disconnect old instance
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }

    currentApiKey = key;

    socketInstance = io(BASE_URL, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        transports: ["websocket", "polling"],
        autoConnect: true,
        auth: {
            apiKey: key,
            name: displayName,
        },
    });

    socketInstance.on("connect", () => {
        console.log("[Socket] ✅ Connected:", socketInstance.id);
    });

    socketInstance.on("connect_error", (err) => {
        console.warn("[Socket] ❌ Connection error:", err.message);
    });

    socketInstance.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
    });

    socketInstance.on("reconnect", (attempt) => {
        console.log("[Socket] Reconnected after", attempt, "attempt(s)");
    });

    return socketInstance;
};

/**
 * Destroy the current socket instance.
 */
export const destroySocket = () => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        currentApiKey = "";
    }
};

/**
 * Tear down and recreate the socket with a new API key.
 */
export const reinitSocket = (apiKey = "", name = "") => {
    destroySocket();
    return initSocket(apiKey, name);
};

/** Get the raw socket instance (may be null) */
export const getSocket = () => socketInstance;

// ── Room operations ────────────────────────────────────────────────────────

/**
 * Join a specific incident war room.
 * Resolves with the ack payload or rejects on failure.
 */
export const joinIncidentRoom = (incidentId) =>
    new Promise((resolve, reject) => {
        const socket = socketInstance;
        if (!socket?.connected) {
            reject(new Error("Socket not connected"));
            return;
        }
        socket.emit("join_incident_room", { incidentId }, (ack) => {
            if (ack?.success) resolve(ack);
            else reject(new Error(ack?.message || "Failed to join incident room"));
        });
    });

/**
 * Join the global / service-level war room.
 * Resolves with the ack payload or rejects on failure.
 */
export const joinWarRoom = () =>
    new Promise((resolve, reject) => {
        const socket = socketInstance;
        if (!socket?.connected) {
            reject(new Error("Socket not connected"));
            return;
        }
        socket.emit("join_warroom", null, (ack) => {
            if (ack?.success) resolve(ack);
            else reject(new Error(ack?.message || "Failed to join war room"));
        });
    });

// ── Messaging ──────────────────────────────────────────────────────────────

/**
 * Send a chat/update message to the current room.
 * @param {{ content: string, fileUrl?: string, fileType?: string }} payload
 */
export const sendMessage = (payload) =>
    new Promise((resolve, reject) => {
        const socket = socketInstance;
        if (!socket?.connected) {
            reject(new Error("Socket not connected"));
            return;
        }
        socket.emit("message:new", payload, (ack) => {
            if (ack?.success) resolve(ack);
            else reject(new Error(ack?.message || "Failed to send message"));
        });
    });

// ── Event helpers ──────────────────────────────────────────────────────────

export const SOCKET_EVENTS = {
    // Server → Client
    MESSAGE_NEW: "message:new",
    ROOM_PRESENCE: "room:presence",
    INCIDENT_UPDATE: "incident:update",
    INCIDENT_RESOLVED: "incident:resolved",
    CHAT_MESSAGE: "chat:message",
    ERROR_EVENT: "error:event",

    // Client → Server
    JOIN_INCIDENT_ROOM: "join_incident_room",
    JOIN_WARROOM: "join_warroom",
    SEND_MESSAGE: "message:new",
};
