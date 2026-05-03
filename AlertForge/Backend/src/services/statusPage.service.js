// FEATURE-9: Public Status Page Service
import { getAllServicesDAO } from "../dao/service.dao.js";
import { getAllIncidentsDAO } from "../dao/incident.dao.js";
import { findActiveApiKeyByUserDAO } from "../dao/apikey.dao.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * Orchestrates the public status page data aggregation.
 * Decouples logic from the controller for better maintainability and performance.
 */
export const getPublicStatusService = async (userId) => {
    if (!userId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "User ID is required");
    }

    // 1. Resolve the apiKeyId for this user so we can scope incident queries correctly
    const apiKey = await findActiveApiKeyByUserDAO(userId);
    const apiKeyId = apiKey?._id || null;

    // 2. Fetch services and incidents in parallel for performance
    const [services, allIncidents] = await Promise.all([
        getAllServicesDAO(userId),
        apiKeyId ? getAllIncidentsDAO(apiKeyId, null) : Promise.resolve([]),
    ]);

    // 3. Separate active from resolved incidents
    const activeIncidents = allIncidents.filter(i => i.status !== "resolved");
    const incidentHistory = allIncidents
        .filter(i => i.status === "resolved")
        .slice(0, 20); // Last 20 resolved incidents

    // 4. Compute overall system status from service statuses
    const hasOutage = services.some(s => s.status === "outage");
    const hasDegraded = services.some(s => s.status === "degraded");
    const overallStatus = hasOutage ? "outage" : hasDegraded ? "degraded" : "operational";

    // 5. Average uptime across all services
    const avgUptime = services.length > 0
        ? (services.reduce((sum, s) => sum + (s.uptimePercent ?? 100), 0) / services.length).toFixed(2)
        : 100;

    return {
        overallStatus,
        uptimePercent: parseFloat(avgUptime),
        services: services.map(s => ({
            id: s._id,
            name: s.name,
            status: s.status,
            uptimePercent: s.uptimePercent,
            incidentCount: s.incidentCount,
        })),
        activeIncidents: activeIncidents.map(i => ({
            id: i._id,
            title: i.title || i.message,
            status: i.status,
            severity: i.severity,
            startedAt: i.startedAt || i.createdAt,
            service: i.service,
        })),
        incidentHistory: incidentHistory.map(i => ({
            id: i._id,
            title: i.title || i.message,
            severity: i.severity,
            startedAt: i.startedAt || i.createdAt,
            resolvedAt: i.resolvedAt,
            service: i.service,
        })),
    };
};
