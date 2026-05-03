import express from "express"
import path from "path";
import { fileURLToPath } from "url";
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import incidentRouter from "./routes/incident.routes.js";
import apiKeyRouter from "./routes/apikey.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import userRouter from "./routes/user.routes.js";
import webhookRouter from "./routes/webhook.routes.js";
import postmortemRouter from "./routes/postmortem.routes.js";
import authRouter from "./routes/auth.routes.js";
// FEATURE-6: Service Registry
import serviceRouter from "./routes/service.routes.js";
// FEATURE-8: Team System
import teamRouter from "./routes/team.routes.js";
// FEATURE-9: Public Status Page
import statusPageRouter from "./routes/statusPage.routes.js";
// FEATURE-4: War Room
import warRoomRouter from "./routes/warroom.routes.js";


import { publicApiLimiter } from "./middleware/rateLimiter/index.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(morgan('dev'));

// Global Rate Limiting Baseline
app.use(publicApiLimiter);

//NOTE -  Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"], // Support both standard React/Vite ports
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "../public")));

// Initialize Passport for Google OAuth
app.use(passport.initialize());

//NOTE -  Routes
app.use(`/api/auth`, authRouter)
app.use(`/api/apikeys`, apiKeyRouter)
app.use(`/api/incidents`, incidentRouter)
app.use(`/api/users`, userRouter)
app.use(`/api/webhooks`, webhookRouter)
app.use(`/api/postmortem`, postmortemRouter)
app.use(`/postmortem`, postmortemRouter)
app.use(`/api`, uploadRouter)
// New feature routes
app.use(`/api/services`, serviceRouter)
app.use(`/api/team`, teamRouter)
app.use(`/api/status-page`, statusPageRouter)
app.use(`/api/warroom`, warRoomRouter)


app.use(errorHandler);

// Catch-all route for SPA - serves the frontend for any non-API routes
app.get("*any", (req, res, next) => {
    if (req.url.startsWith("/api") || req.url.startsWith("/socket.io")) {
        return next();
    }
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

export default app;



