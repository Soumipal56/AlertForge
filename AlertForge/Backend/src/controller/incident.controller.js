import { 
    createIncidentService, 
    getAllIncidentsService, 
    getIncidentByIdService, 
    updateIncidentStatusService, 
    updateIncidentSeverityService 
} from "../services/incident.service.js";
import { 
    getTimelineEventsByIncidentService,
    createTimelineEventService
} from "../services/timeline/timeline.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { incidentSchema } from "../validators/incident.validator.js";
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, INCIDENT_STATUS, SEVERITY } from "../config/constants.js";
import { sendIncidentNotifications } from "../services/notification/notification.service.js";
import { emitIncidentUpdate, emitNewIncident, emitTimelineEvent } from "../services/socket/socket.service.js";
import { createTimelineEventService as internalCreateTimelineService } from "../services/timeline/timeline.service.js";
import { generatePostmortem } from "../services/postmortem.service.js";

// ... existing buildIncidentSocketPayload and saveTimelineEntry ...

/**
 * @description Controller function to retrieve the timeline of an incident
 */
export const getIncidentTimeline = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { limit } = req.query;

        const timeline = await getTimelineEventsByIncidentService(
            id, 
            req.apiKey._id, 
            limit ? parseInt(limit) : 50
        );

        return res.json(new ApiResponse(200, "Timeline fetched", timeline));
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller function to add a manual note/event to the timeline
 */
export const addTimelineNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { message, metadata } = req.body;

        if (!message) {
            throw new ApiError(400, "Message is required for timeline note");
        }

        const incident = await getIncidentByIdService(id, req.apiKey._id);
        if (!incident) {
            throw new ApiError(404, "Incident not found");
        }

        const timelineEvent = await createTimelineEventService({
            type: "manual_note",
            incidentId: id,
            message,
            metadata: metadata || {},
            createdBy: req.user?.userId || null,
        });

        emitTimelineEvent({
            type: "manual_note",
            incident: buildIncidentSocketPayload(incident),
            event: timelineEvent
        });

        return res.status(201).json(new ApiResponse(201, "Note added to timeline", timelineEvent));
    } catch (error) {
        next(error);
    }
};


const buildIncidentSocketPayload = (incident) => ({
    id: incident?._id?.toString?.() || incident?.id || null,
    title: incident?.title || incident?.message,
    severity: incident?.severity,
    status: incident?.status,
    createdAt: incident?.createdAt,
    updatedAt: incident?.updatedAt,
});

const saveTimelineEntry = async (type, incident, message = "", metadata = {}) => {
    // Save timeline event after incident changes so the activity feed survives refreshes.
    try {
        await createTimelineEventService({
            type,
            incidentId: incident?._id?.toString?.() || incident?.id,
            message,
            metadata,
        });
    } catch (error) {
        console.error("[Timeline] Failed to persist timeline entry:", error.message);
    }
};


/**  
 * @description Controller function to create a new incident
 * - Validates the request body using Zod schema
 * - Calls the service function to create the incident
 * - Returns a standardized API response with the created incident data
 * @param {Object} req - Express request object containing incident data in req.body
 * @param {Object} res - Express response object used to send the API response
 * @param {Function} next - Express next function for error handling
 * @returns {Object} API response with status code, message, and created incident data
 */
export const createIncident = async (req, res, next) => {
    try {
        const data = req.body;
        //NOTE- here will be validation using zod schema. If validation fails, it will throw an error which will be caught in the catch block and passed to the error handling middleware.
        const validation = incidentSchema.safeParse(data);
        if (!validation.success) {
            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                validation.error.errors[0].message
            );
        }

        const incident = await createIncidentService({
            ...data,
            apiKeyId: req.apiKey._id,
        }, req.user?.userId);
        
        await saveTimelineEntry("incident.created", incident, incident?.title || incident?.message || "");

        // Multi-channel notification fan-out
        const user = req.apiKey.user;
        if (user) {
            sendIncidentNotifications(user, incident);
        }

        emitNewIncident(incident);
        emitTimelineEvent({
            type: "incident.created",
            incident: buildIncidentSocketPayload(incident),
        });

        return res
            .status(HTTP_STATUS.CREATED)
            .json(new ApiResponse(
                HTTP_STATUS.CREATED,
                SUCCESS_MESSAGES.INCIDENT.CREATED,
                incident
            ));

    } catch (error) {
        next(error);
    }
};
/**  
 * @description Controller function to retrieve all incidents for the dashboard
 * - Extracts 'status' filter from query params
 * - Validates status (all, investigating, identified, monitoring, resolved)
 * - Returns filtered incidents + status-wise counts
 * @returns {Object} API response with status code, message, and structured data
 */
export const getAllIncidents = async (req, res, next) => {
    try {
        const { status } = req.query;
        const normalizedStatus = typeof status === "string" ? status.trim().toLowerCase() : "all";

        const validStatuses = ["all", "investigating", "identified", "monitoring", "resolved","active"];
        if (!validStatuses.includes(normalizedStatus)) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid status filter");
        }


        const { incidents, counts } = await getAllIncidentsService(req.apiKey._id, normalizedStatus);

        return res.json(new ApiResponse(
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.INCIDENT.FETCHED,
            { incidents, counts }
        ));

    } catch (error) {
        next(error);
    }
};


/**  
 * @description Controller function to retrieve a single incident by its ID
 * - Extracts the incident ID from the request parameters
 * - Calls the service function to get the incident from the database
 * - If the incident is not found, throws a 404 error
 * - Returns a standardized API response with the incident data if found
 * @param {Object} req - Express request object containing incident ID in req.params
 * @param {Object} res - Express response object used to send the API response
 * @param {Function} next - Express next function for error handling
 * @returns {Object} API response with status code, message, and incident data if found
 */
export const getIncidentById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const incident = await getIncidentByIdService(id, req.apiKey._id);

        if (!incident) {
            throw new ApiError(404, "Incident not found");
        }

        return res.json(new ApiResponse(200, "Incident fetched", incident));
    } catch (error) {
        next(error);
    }
};


/**  
 * @description Controller function to update the status of an incident
 * - Validates lifecycle transitions via Service layer
 * - Triggers Timeline, Sockets, and AI Postmortem
 */
export const updateIncidentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const normalizedStatus = typeof status === "string" ? status.trim().toLowerCase() : "";

        // Service layer handles transition validation and resolvedAt timestamp
        const updated = await updateIncidentStatusService(id, req.apiKey._id, normalizedStatus);

        await saveTimelineEntry("incident.status_changed", updated, `Status changed to ${updated.status}`);
        emitIncidentUpdate(updated);
        emitTimelineEvent({
            type: "incident.status_changed",
            incident: buildIncidentSocketPayload(updated),
        });

        // Trigger resolution logic
        if (normalizedStatus === INCIDENT_STATUS.RESOLVED) {
            await saveTimelineEntry("incident.resolved", updated, "Incident resolved");
            emitTimelineEvent({
                type: "incident.resolved",
                incident: buildIncidentSocketPayload(updated),
            });

            try {
                // Generate the postmortem immediately
                await generatePostmortem(updated?._id?.toString?.() || id, req.apiKey._id);
            } catch (error) {
                console.error("[Postmortem] Generation failed:", error.message);
            }
        }

        return res.json(new ApiResponse(200, "Incident status updated", updated));
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller function to update the severity of an incident
 */
export const updateIncidentSeverity = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { severity } = req.body;
        const normalizedSeverity = typeof severity === "string" ? severity.trim().toUpperCase() : "";

        const updated = await updateIncidentSeverityService(id, req.apiKey._id, normalizedSeverity);

        await saveTimelineEntry("incident.severity_changed", updated, `Severity changed to ${updated.severity}`);
        emitIncidentUpdate(updated);
        emitTimelineEvent({
            type: "incident.severity_changed",
            incident: buildIncidentSocketPayload(updated),
        });

        return res.json(new ApiResponse(200, "Incident severity updated", updated));
    } catch (error) {
        next(error);
    }
};

