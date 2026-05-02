// FEATURE-4: War Room Orchestration Service
import { createWarRoomMessageDAO, getRecentWarRoomMessagesDAO, updateWarRoomTaskStatusDAO } from "../../dao/warRoomMessage.dao.js";
import { getIncidentByIdDAO } from "../../dao/incident.dao.js";
import { autoLogTimelineEvent } from "../timeline/timeline.service.js";
import { TIMELINE_EVENTS } from "../../utils/timeline.constants.js";
import ApiError from "../../utils/ApiError.js";
import { HTTP_STATUS } from "../../config/constants.js";

/**
 * Orchestrates War Room communication and task management.
 * Connects messages to incident timelines for auditability.
 */
export const getWarRoomHistoryService = async (roomId, apiKeyId) => {
    // 1. Security Check: The roomId is the incidentId
    const incident = await getIncidentByIdDAO(roomId, apiKeyId);
    if (!incident) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Incident/War Room not found");
    }

    return await getRecentWarRoomMessagesDAO(roomId);
};

export const sendWarRoomMessageService = async (data, apiKeyId, user) => {
    // 1. Security Check
    const incident = await getIncidentByIdDAO(data.roomId, apiKeyId);
    if (!incident) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Incident/War Room not found");
    }

    // 2. Format sender info (SDK vs Dashboard compatible)
    data.sender = {
        apiKeyId: apiKeyId.toString(),
        name: user?.name || "Responder",
        serviceName: user?.serviceName || null
    };

    const message = await createWarRoomMessageDAO(data);

    // 3. Orchestration: If it's a 'note' or 'task', auto-log to the global timeline
    if (data.type === "note" || data.type === "task") {
        await autoLogTimelineEvent({
            incidentId: data.roomId,
            apiKeyId,
            type: data.type === "task" ? TIMELINE_EVENTS.TASK_CREATED : TIMELINE_EVENTS.NOTE_ADDED,
            message: data.type === "task" ? `[Task Created] ${data.content}` : data.content,
            user
        });
    }

    return message;
};

export const toggleWarRoomTaskService = async (messageId, roomId, isCompleted, apiKeyId, user) => {
    // 1. Security Check
    const incident = await getIncidentByIdDAO(roomId, apiKeyId);
    if (!incident) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized access to this War Room");
    }

    const updatedTask = await updateWarRoomTaskStatusDAO(messageId, isCompleted);
    
    // 2. Orchestration: Log task completion to timeline
    await autoLogTimelineEvent({
        incidentId: roomId,
        apiKeyId,
        type: TIMELINE_EVENTS.TASK_UPDATED,
        message: `Task ${isCompleted ? "completed" : "reopened"}: ${updatedTask.content}`,
        metadata: { messageId, isCompleted },
        user
    });

    return updatedTask;
};
