import app from "./src/app.js";
import appConfig from "./src/config/appConfig.js";
import connectDB from "./src/config/db.js";
import { createServer } from "http";
import { initSocket } from "./src/config/socket.js";

const startServer = async () => {
    await connectDB();

    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(appConfig.port, () => {
        console.log(`Server is running on port ${appConfig.port}`);
    });
};

startServer();
