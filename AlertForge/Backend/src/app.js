import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

import logger from "./utils/logger.js";
import passport from "./config/passport.js";
import { publicApiLimiter } from "./middleware/rateLimiter/index.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";

// Routes
import incidentRouter from "./routes/incident.routes.js";
import apiKeyRouter from "./routes/apikey.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import userRouter from "./routes/user.routes.js";
import webhookRouter from "./routes/webhook.routes.js";
import postmortemRouter from "./routes/postmortem.routes.js";
import authRouter from "./routes/auth.routes.js";
import serviceRouter from "./routes/service.routes.js";
import teamRouter from "./routes/team.routes.js";
import statusPageRouter from "./routes/statusPage.routes.js";
import warRoomRouter from "./routes/warroom.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// SECURITY HARDENING
app.use(helmet());
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://alertforge.onrender.com",        // ✅ your frontend
        "https://alertforge-api.onrender.com",    // ✅ your backend (if needed)
    ],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
}));

// REQUEST TRACING
app.use((req, res, next) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
    next();
});

// LOGGING
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: { write: (message) => logger.http(message.trim()) }
}));

// MIDDLEWARE
app.use(express.json({ limit: '10kb' })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));

// GLOBAL RATE LIMITER
app.use(publicApiLimiter);

// PASSPORT
app.use(passport.initialize());

// ROUTES
app.use(`/api/auth`, authRouter);
app.use(`/api/apikeys`, apiKeyRouter);
app.use(`/api/incidents`, incidentRouter);
app.use(`/api/users`, userRouter);
app.use(`/api/webhooks`, webhookRouter);
app.use(`/api/postmortem`, postmortemRouter);
app.use(`/api/services`, serviceRouter);
app.use(`/api/team`, teamRouter);
app.use(`/api/status-page`, statusPageRouter);
app.use(`/api/warroom`, warRoomRouter);
app.use(`/api`, uploadRouter);

// LEGACY COMPAT
app.use(`/postmortem`, postmortemRouter);

// HEALTH CHECK
app.get("/", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "AlertForge API",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
    });
});

// SPA HANDLER
app.get("/{*path}", (req, res, next) => {
    if (req.url.startsWith("/api") || req.url.startsWith("/socket.io")) {
        return next();
    }
    // ✅ Don't try to serve frontend files from backend
    res.status(404).json({
        status: "error",
        message: `Route ${req.method} ${req.url} not found`,
    });
});

// ERROR HANDLING
app.use(errorHandler);

export default app;



