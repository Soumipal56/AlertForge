import { io } from "socket.io-client";

let socketInstance = null;

export const initializeSocket = () => {
    if (socketInstance) {
        return socketInstance;
    }

    socketInstance = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", {
        reconnection: true,
        transports: ["websocket", "polling"],
        autoConnect: true,
    });

    socketInstance.on("connect", () => {
        console.log("Connected");
    });

    socketInstance.on("connect_error", (error) => {
        console.log(error);
    });

    return socketInstance;
};

export const getSocket = () => socketInstance;
