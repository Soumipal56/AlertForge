import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

let socketInstance = null;
let socketApiKey = "";

/**
 * @description Initializes (or returns the existing) Socket.io client.
 * Passes the current API key in the handshake `auth.token` field so the
 * backend middleware can validate it before the connection is opened.
 * @param {string} apiKey
 * @returns {import("socket.io-client").Socket}
 */
export const initializeSocket = (apiKey = "") => {
    const normalizedKey = typeof apiKey === "string" ? apiKey.trim() : "";

    if (socketInstance?.connected && normalizedKey === socketApiKey) {
        return socketInstance;
    }

    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }

    socketApiKey = normalizedKey;

    socketInstance = io(SOCKET_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ["websocket", "polling"],
        autoConnect: true,
        auth: {
            token: normalizedKey,
        },
    });

    socketInstance.on("connect", () => {
        console.log("[Socket] Connected:", socketInstance.id);
    });

    socketInstance.on("connect_error", (error) => {
        console.warn("[Socket] Connection error:", error.message);
    });

    return socketInstance;
};

/**
 * @description Disconnects and destroys the current socket instance.
 * Call this before reinitializing when the API key changes.
 */
export const disconnectSocket = () => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
};

/**
 * @description Tears down the existing socket and creates a fresh one.
 * Use when the user updates their API key so the new key is sent in auth.
 * @param {string} apiKey
 * @returns {import("socket.io-client").Socket}
 */
export const reinitializeSocket = (apiKey = "") => {
    disconnectSocket();
    return initializeSocket(apiKey);
};

/**
 * @description Returns the current socket instance (may be null before init).
 * @returns {import("socket.io-client").Socket|null}
 */
export const getSocket = () => socketInstance;
