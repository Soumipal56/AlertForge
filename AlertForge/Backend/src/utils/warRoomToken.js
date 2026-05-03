import jwt from "jsonwebtoken";
import appConfig from "../config/appConfig.js";

const assertWarRoomTokenInputs = ({ incidentId, organizationId }) => {
    if (!incidentId) {
        throw new Error("Incident ID is required to generate a war-room token");
    }
    if (!organizationId) {
        throw new Error("Organization ID is required to generate a war-room token");
    }
    if (!appConfig.jwtAccessSecret) {
        throw new Error("JWT_ACCESS_SECRET is required to generate a war-room token");
    }
};

export const generateWarRoomToken = ({ incidentId, organizationId }) => {
    assertWarRoomTokenInputs({ incidentId, organizationId });

    return jwt.sign(
        {
            incidentId: incidentId.toString(),
            organizationId: organizationId.toString(),
            scope: "warroom:join"
        },
        appConfig.jwtAccessSecret,
        { expiresIn: "7d" }
    );
};

export const buildWarRoomLink = ({ incidentId, token }) => {
    const frontendUrl = (appConfig.frontendUrl || "http://localhost:5173").replace(/\/$/, "");
    const encodedToken = encodeURIComponent(token);

    return `${frontendUrl}/warroom/${incidentId.toString()}?token=${encodedToken}`;
};
