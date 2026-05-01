import { getIo } from "../../config/socket.js";

const buildIncidentPayload = (incident) => ({
    id: incident?._id?.toString?.() || incident?.id,
    message: incident?.message,
    severity: incident?.severity,
    status: incident?.status,
    createdAt: incident?.createdAt,
    updatedAt: incident?.updatedAt,
});

export const emitNewIncident = (incident) => {
    const io = getIo();
    if (!io) return;

    const payload = buildIncidentPayload(incident);
    if (!payload.id) return;

    io.emit("incident:new", payload);
};

export const emitIncidentUpdate = (incident) => {
    const io = getIo();
    if (!io) return;

    const payload = buildIncidentPayload(incident);
    if (!payload.id) return;

    io.emit("incident:update", payload);
};

export const emitTimelineEvent = (event) => {
    const io = getIo();
    if (!io) return;

    io.emit("timeline:event", event);
};
