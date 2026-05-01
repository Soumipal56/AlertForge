import { createIncidentService, getAllIncidentsService, getIncidentByIdService, updateIncidentStatusService } from "../services/incident.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { incidentSchema } from "../validators/incident.validator.js";
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from "../config/constants.js";
import { sendIncidentNotification } from "../services/notification/notification.service.js";
import { emitIncidentUpdate, emitNewIncident, emitTimelineEvent } from "../services/socket/socket.service.js";
import { createTimelineEventService } from "../services/timeline/timeline.service.js";

const buildIncidentSocketPayload = (incident) => ({
    id: incident?._id?.toString?.() || incident?.id || null,
    message: incident?.message,
    severity: incident?.severity,
    status: incident?.status,
    createdAt: incident?.createdAt,
    updatedAt: incident?.updatedAt,
});

const saveTimelineEntry = async (type, incident, message = "") => {
    // Save timeline event after incident changes so the activity feed survives refreshes.
    try {
        await createTimelineEventService({
            type,
            incidentId: incident?._id?.toString?.() || incident?.id,
            message,
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
        });
        await saveTimelineEntry("incident.created", incident, incident?.message || "");
        //NOTE - for making our api faster we are sending email notification in the background without waiting for it to complete. 
        //! This is a fire-and-forget approach. If we want to ensure that the email is sent before responding, we can await this function, but it will increase the response time of our API.
        sendIncidentNotification(incident);
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
 * @description Controller function to retrieve all incidents
 * - Calls the service function to get all incidents from the database
 * - Returns a standardized API response with the list of incidents
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object used to send the API response
 * @param {Function} next - Express next function for error handling
 * @returns {Object} API response with status code, message, and list of incidents
 */
export const getAllIncidents = async (req, res, next) => {
    try {
        const incidents = await getAllIncidentsService();

        return res.json(new ApiResponse(
            HTTP_STATUS.OK,
            SUCCESS_MESSAGES.INCIDENT.FETCHED,
            incidents
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

        const incident = await getIncidentByIdService(id);

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
 * - Extracts the incident ID from the request parameters and new status from the request body
 * - Calls the service function to update the incident status in the database
 * - If the incident is not found, throws a 404 error
 * - Returns a standardized API response with the updated incident data if found
 * @param {Object} req - Express request object containing incident ID in req.params and new status in req.body
 * @param {Object} res - Express response object used to send the API response
 * @param {Function} next - Express next function for error handling
 * @returns {Object} API response with status code, message, and updated incident data if found
 */
export const updateIncidentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updated = await updateIncidentStatusService(id, status);

        if (!updated) {
            throw new ApiError(404, "Incident not found");
        }

        await saveTimelineEntry("incident.status_changed", updated, `Status changed to ${updated.status}`);
        emitIncidentUpdate(updated);
        emitTimelineEvent({
            type: "incident.status_changed",
            incident: buildIncidentSocketPayload(updated),
        });

        return res.json(new ApiResponse(200, "Incident updated", updated));
    } catch (error) {
        next(error);
    }
};
