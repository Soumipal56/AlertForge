import { Server } from "socket.io";

let ioInstance = null;

export const initSocket = (httpServer) => {
    ioInstance = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    ioInstance.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("disconnect", (reason) => {
            console.log(`Socket disconnected: ${socket.id} (${reason})`);
        });
    });

    return ioInstance;
};

export const getIo = () => ioInstance;
