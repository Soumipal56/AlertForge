import express from "express"
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

import { publicApiLimiter } from "./middleware/rateLimiter/index.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";

const app = express();
app.use(morgan('dev'));

// Global Rate Limiting Baseline
app.use(publicApiLimiter);

//NOTE -  Middleware
//NOTE -  Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"], // Support both standard React/Vite ports
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
}));
app.use(express.json());
app.use(cookieParser());


// Initialize Passport for Google OAuth
app.use(passport.initialize());

//NOTE -  Routes
app.get(`/`, (req, res) => {
    res.send("Welcome to AlertForge API");
})
app.use(`/api/auth`, authRouter)
app.use(`/api/apikeys`, apiKeyRouter)
app.use(`/api/incidents`, incidentRouter)
app.use(`/api/users`, userRouter)
app.use(`/api/webhooks`, webhookRouter)
app.use(`/api/postmortem`, postmortemRouter)
app.use(`/postmortem`, postmortemRouter)
app.use(`/api`, uploadRouter)

app.use(errorHandler);

export default app;
