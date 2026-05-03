// sdk/tests/warroom.test.js
import { connectSocket, disconnectSocket } from "../core/socket/socketClient.js";
import warroom from "../packages/warroom/index.js";
import logger from "../core/utils/logger.js";

export const testWarRoom = async () => {
    logger.info("Running War Room Tests...");
    
    try {
        // 1. Connect Socket
        const socket = connectSocket();
        
        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("Socket connection timeout")), 5000);
            socket.on("connect", () => {
                clearTimeout(timer);
                resolve();
            });
        });
        logger.info("✔ Socket connected successful");

        // 2. Join Room (Mock/Simple)
        warroom.joinWarRoom("test-incident-123");
        logger.info("✔ Join warroom event emitted");

        // 3. Send Message
        warroom.sendMessage("test-incident-123", "Hello from SDK Test");
        logger.info("✔ Send message event emitted");

        disconnectSocket();
        return true;
    } catch (err) {
        logger.error("War Room Test Failed:", err.message);
        disconnectSocket();
        return false;
    }
};
