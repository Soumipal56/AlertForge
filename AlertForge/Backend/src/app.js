import express from "express"
import cors from 'cors'
import morgan from 'morgan'
import incidentRouter from "./routes/incident.routes.js";
import apiKeyRouter from "./routes/apikey.routes.js";
import uploadRouter from "./routes/upload.routes.js";

import { publicApiLimiter } from "./middleware/rateLimiter/index.js";

const app = express();
app.use(morgan('dev'));

// Global Rate Limiting Baseline
app.use(publicApiLimiter);

//NOTE -  Middleware
app.use(cors({
    origin: "http://localhost:5173", // Update with your frontend URL
    methods: ["GET", "POST", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
}));
app.use(express.json());

//NOTE -  Routes
app.get(`/`, (req, res) => {
    res.send("Welcome to AlertForge API");
})
app.use(`/api/apikeys`, apiKeyRouter)
app.use(`/api/incidents`, incidentRouter)
app.use(`/api`, uploadRouter)


export default app;
