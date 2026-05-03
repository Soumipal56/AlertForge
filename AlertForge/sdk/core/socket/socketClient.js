// sdk/core/socket/socketClient.js
import { io } from "socket.io-client";
import { getConfig } from "../config/index.js";
import logger from "../utils/logger.js";

let socketInstance = null;

/**
 * Socket.io client wrapper for AlertForge.
 */
export const connectSocket = (apiKeyOverride = null) => {
    const { socketURL, apiKey } = getConfig();
    const finalKey = apiKeyOverride || apiKey;

    if (socketInstance?.connected) {
        return socketInstance;
    }

    logger.info("Connecting to socket server:", socketURL);

    socketInstance = io(socketURL, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        auth: {
            apiKey: finalKey,
        },
    });

    socketInstance.on("connect", () => {
        logger.info("Socket connected:", socketInstance.id);
    });

    socketInstance.on("connect_error", (err) => {
        logger.error("Socket connection failed:", err.message);
    });

    return socketInstance;
};

export const disconnectSocket = () => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
};

export const getSocket = () => socketInstance;

export const socketActions = {
    joinWarRoom: (incidentId) => {
        if (!socketInstance) throw new Error("Socket not connected");
        socketInstance.emit("join_warroom", { incidentId });
    },
    sendMessage: (incidentId, message) => {
        if (!socketInstance) throw new Error("Socket not connected");
        socketInstance.emit("chat:message", { incidentId, message });
    },
    on: (event, callback) => {
        if (!socketInstance) throw new Error("Socket not connected");
        socketInstance.on(event, callback);
    }
};

export default socketActions;
