import mongoose from "mongoose";
import { createServer } from "http";
import app from "./src/app.js";
import appConfig from "./src/config/appConfig.js";
import connectDB from "./src/config/db.js";
import { initSocket } from "./src/config/socket.js";

/**
 * PRODUCTION-READY SERVER BOOTSTRAP
 * Handles graceful startup, port conflicts, and clean shutdowns.
 */
const startServer = async () => {
    try {
        // 1. Initialize Database
        await connectDB();

        // 2. Setup HTTP & Socket.IO
        const httpServer = createServer(app);
        await initSocket(httpServer);

        // 3. Port Handling (Env-first for Render/Heroku compatibility)
        const PORT = appConfig.port || process.env.PORT || 3000;

        const server = httpServer.listen(PORT, () => {
            console.log(`[Server] Status: Online`);
            console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
            console.log(`[Server] Listening on port: ${PORT}`);
        });

        // 4. Graceful Error Handling (EADDRINUSE)
        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(`[Fatal] Port ${PORT} is already in use.`);
                console.info(`[Action] Please kill the process on port ${PORT} or use a different PORT in .env.`);
                process.exit(1);
            }
            throw error;
        });

        // 5. Graceful Shutdown Handling (SIGINT / SIGTERM)
        const shutdown = async (signal) => {
            console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
            
            server.close(async () => {
                console.log("[Server] HTTP server closed.");
                
                try {
                    await mongoose.connection.close();
                    console.log("[Database] MongoDB connection closed.");
                    process.exit(0);
                } catch (err) {
                    console.error("[Error] Failure during DB shutdown:", err.message);
                    process.exit(1);
                }
            });

            // Force close after 10s if graceful shutdown fails
            setTimeout(() => {
                console.error("[Fatal] Could not close connections in time, forcefully shutting down.");
                process.exit(1);
            }, 10000);
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));

    } catch (error) {
        console.error("[Fatal] Startup failed:", error.message);
        process.exit(1);
    }
};

// Prevent multiple instances if script is required elsewhere
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    startServer();
} else {
    // Standard execution for ESM modules in Node
    startServer();
}

