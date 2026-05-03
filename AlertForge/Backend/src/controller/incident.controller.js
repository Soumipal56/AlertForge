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
import { getWarRoomSuggestions } from "../services/ai/suggestion.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS, SUCCESS_MESSAGES, INCIDENT_STATUS } from "../config/constants.js";
import { TIMELINE_EVENTS } from "../utils/timeline.constants.js";
import { emitTimelineEvent } from "../services/socket/socket.service.js";

/**
 * @description Controller function to retrieve the timeline of an incident
 */
export const getIncidentTimeline = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit } = req.query;

    const timeline = await getTimelineEventsByIncidentService(
        id, 
        req.user.organizationId, 
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 20
    );

    return res.json(new ApiResponse(HTTP_STATUS.OK, "Timeline fetched", timeline));
});

/**
 * @description Controller function to add a manual note/event to the timeline
 */
export const addTimelineNote = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message, metadata, isPublic } = req.body;

    if (!message) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Message is required for timeline note", 'MISSING_FIELD');
    }

    const timelineEvent = await createTimelineEventService({
        type: TIMELINE_EVENTS.NOTE_ADDED,
        incidentId: id,
        message,
        metadata: metadata || {},
        createdBy: req.user?.id || null,
        authorName: req.user?.name || "Responder",
        isPublic: isPublic !== undefined ? isPublic : true,
    }, req.user.organizationId);

    // Trigger real-time update
    emitTimelineEvent({
        type: TIMELINE_EVENTS.NOTE_ADDED,
        incidentId: id,
        event: timelineEvent
    });

    return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, "Note added to timeline", timelineEvent));
});

export const createIncident = asyncHandler(async (req, res) => {
    // Validation is now handled by middleware
    const incident = await createIncidentService(req.body, req.user, req.apiKey);
    
    return res
        .status(HTTP_STATUS.CREATED)
        .json(new ApiResponse(
            HTTP_STATUS.CREATED,
            SUCCESS_MESSAGES.INCIDENT.CREATED,
            incident
        ));
});

export const createAndBroadcastIncident = asyncHandler(async (req, res) => {
    const incident = await createIncidentService(req.body, req.user, req.apiKey, true);
    
    return res
        .status(HTTP_STATUS.CREATED)
        .json(new ApiResponse(
            HTTP_STATUS.CREATED,
            "Incident created and broadcasted successfully",
            incident
        ));
});

/**  
 * @description Controller function to retrieve all incidents for the dashboard
 */
export const getAllIncidents = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const normalizedStatus = typeof status === "string" ? status.trim().toLowerCase() : "all";

    const validStatuses = ["all", ...Object.values(INCIDENT_STATUS)];
    if (!validStatuses.includes(normalizedStatus)) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid status filter", 'INVALID_FILTER');
    }

    const { incidents, counts } = await getAllIncidentsService(req.user.organizationId, normalizedStatus);

    return res.json(new ApiResponse(
        HTTP_STATUS.OK,
        SUCCESS_MESSAGES.INCIDENT.FETCHED,
        { incidents, counts }
    ));
});

/**  
 * @description Controller function to retrieve a single incident by its ID
 */
export const getIncidentById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const incident = await getIncidentByIdService(id, req.user.organizationId);

    if (!incident) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Incident not found", 'NOT_FOUND');
    }

    return res.json(new ApiResponse(HTTP_STATUS.OK, "Incident fetched", incident));
});

/**  
 * @description Controller function to update the status of an incident
 */
export const updateIncidentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const normalizedStatus = typeof status === "string" ? status.trim().toLowerCase() : "";

    const updated = await updateIncidentStatusService(id, req.user.organizationId, req.apiKey._id, normalizedStatus, req.user);

    return res.json(new ApiResponse(HTTP_STATUS.OK, "Incident status updated", updated));
});

/**
 * @description Controller function to update the severity of an incident
 */
export const updateIncidentSeverity = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { severity } = req.body;
    const normalizedSeverity = typeof severity === "string" ? severity.trim().toUpperCase() : "";

    const updated = await updateIncidentSeverityService(id, req.user.organizationId, req.apiKey._id, normalizedSeverity, req.user);

    return res.json(new ApiResponse(HTTP_STATUS.OK, "Incident severity updated", updated));
});

/**
 * @description Controller function to get AI-driven suggestions for an incident
 */
export const getIncidentSuggestionsController = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const incident = await getIncidentByIdService(id, req.user.organizationId);

    if (!incident) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Incident not found", 'NOT_FOUND');
    }

    const suggestions = await getWarRoomSuggestions(incident);
    return res.json(new ApiResponse(HTTP_STATUS.OK, "AI Suggestions generated", { suggestions }));
});

