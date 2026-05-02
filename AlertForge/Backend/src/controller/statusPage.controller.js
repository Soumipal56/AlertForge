// FEATURE-9: Public Status Page Controller
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../config/constants.js";
import { getAllServicesDAO } from "../dao/service.dao.js";
import { getAllIncidentsDAO } from "../dao/incident.dao.js";
import { findActiveApiKeyByUserDAO } from "../dao/apikey.dao.js";

/**
 * GET /api/status-page/public/:userId
 * Public endpoint — no auth required.
 * Returns: uptime %, operational status, active incidents, and incident history.
 */
export const getPublicStatusPage = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "User ID is required");
        }

        // Resolve the apiKeyId for this user so we can scope incident queries correctly
        const apiKey = await findActiveApiKeyByUserDAO(userId);
        const apiKeyId = apiKey?._id || null;

        // Fetch services and incidents in parallel for performance
        const [services, allIncidents] = await Promise.all([
            getAllServicesDAO(userId),
            apiKeyId ? getAllIncidentsDAO(apiKeyId, null) : Promise.resolve([]),
        ]);

        // Separate active from resolved incidents
        const activeIncidents = allIncidents.filter(i => i.status !== "resolved");
        const incidentHistory = allIncidents
            .filter(i => i.status === "resolved")
            .slice(0, 20); // Last 20 resolved incidents

        // Compute overall system status from service statuses
        const hasOutage = services.some(s => s.status === "outage");
        const hasDegraded = services.some(s => s.status === "degraded");
        const overallStatus = hasOutage ? "outage" : hasDegraded ? "degraded" : "operational";

        // Average uptime across all services
        const avgUptime = services.length > 0
            ? (services.reduce((sum, s) => sum + (s.uptimePercent ?? 100), 0) / services.length).toFixed(2)
            : 100;

        return res.json(new ApiResponse(HTTP_STATUS.OK, "Status page fetched", {
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
        }));
    } catch (error) {
        next(error);
    }
};

