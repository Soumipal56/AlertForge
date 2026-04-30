import express from "express"
import incidentRouter from "./routes/incident.routes.js";

const app = express();

//NOTE -  Middleware
app.use(express.json());

//NOTE -  Routes
app.get(`/`, (req, res) => {
    res.send("Welcome to AlertForge API");
})
app.use(`/api/incidents`,incidentRouter)


export default app;