import { getIo } from "../../config/socket.js";

/**
 * @description Builds a clean, safe incident payload from a MongoDB document.
 * Maps _id -> id and strips all internal Mongoose metadata.
 */
const buildIncidentPayload = (incident) => ({
    id: incident?._id?.toString?.() || incident?.id,
    message: incident?.message,
    service: incident?.service,
    severity: incident?.severity,
    status: incident?.status,
    createdAt: incident?.createdAt,
    updatedAt: incident?.updatedAt,
});

/**
 * @description Resolves the emit target.
 * If the incident has a service name, emit to that specific War Room.
 * Falls back to broadcasting globally so no events are silently dropped.
 * @param {import("socket.io").Server} io
 * @param {string|undefined} serviceName
 * @returns {import("socket.io").Server | import("socket.io").BroadcastOperator}
 */
const resolveTarget = (io, serviceName) => {
    if (serviceName && typeof serviceName === "string" && serviceName.trim()) {
        return io.to(serviceName.trim().toLowerCase());
    }
    return io;
};

/**
 * @description Broadcasts "incident:new" when a new incident is created.
 * Scoped to the incident's service room if available, otherwise global.
 * @param {Object} incident - The MongoDB incident document.
 */
export const emitNewIncident = (incident) => {
    const io = getIo();
    if (!io) return;

    const payload = buildIncidentPayload(incident);
    if (!payload.id) return;

    resolveTarget(io, incident?.service).emit("incident:new", payload);
};

/**
 * @description Broadcasts "incident:update" when an incident's status changes.
 * Scoped to the incident's service room if available, otherwise global.
 * @param {Object} incident - The updated MongoDB incident document.
 */
export const emitIncidentUpdate = (incident) => {
    const io = getIo();
    if (!io) return;

    const payload = buildIncidentPayload(incident);
    if (!payload.id) return;

    // 1. Notify service room (for dashboard list updates)
    resolveTarget(io, incident?.service).emit("incident:update", payload);

    // 2. Notify specific incident room if resolved (for live war room read-only mode toggle)
    if (payload.status === "resolved") {
        io.to(`incident:${payload.id}`).emit("incident:resolved", {
            incidentId: payload.id,
            status: payload.status,
        });
    }
};

/**
 * @description Broadcasts "timeline:event" for activity feed entries.
 * Scoped to the incident's service room if available, otherwise global.
 * @param {{ type: string, incident: Object }} event - The timeline event payload.
 */
export const emitTimelineEvent = (event) => {
    const io = getIo();
    if (!io) return;

    resolveTarget(io, event?.incident?.service).emit("timeline:event", event);
};

/**
 * @description Broadcasts a new message or task in the War Room.
 */
export const emitWarRoomMessage = (message) => {
    const io = getIo();
    if (!io) return;

    const room = message.roomId.trim().toLowerCase();
    
    // Broadcast to the specific war room
    io.to(room).emit(message.type === "task" ? "task:update" : "message:new", message);
};

/**
 * @description Specifically broadcasts a task status toggle.
 */
export const emitTaskUpdate = (roomId, taskData) => {
    const io = getIo();
    if (!io) return;

    io.to(roomId.trim().toLowerCase()).emit("task:update", taskData);
};


