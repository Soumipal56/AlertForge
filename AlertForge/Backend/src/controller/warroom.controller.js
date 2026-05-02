// FEATURE-4: War Room Controller
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";
import { 
    getWarRoomHistoryService, 
    sendWarRoomMessageService, 
    toggleWarRoomTaskService 
} from "../services/warroom/warRoom.service.js";
import { emitWarRoomMessage } from "../services/socket/socket.service.js";

/**
 * GET /api/warroom/:roomId/messages
 */
export const getWarRoomMessages = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const messages = await getWarRoomHistoryService(roomId, req.user.organizationId);
        return res.json(new ApiResponse(HTTP_STATUS.OK, "Messages fetched", messages));
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/warroom/messages
 */
export const sendWarRoomMessage = async (req, res, next) => {
    try {
        const message = await sendWarRoomMessageService(req.body, req.user.organizationId, req.apiKey._id, req.user);
        
        // Broadcast via Socket.IO
        emitWarRoomMessage(message);

        return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, "Message sent", message));
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/warroom/tasks
 */
export const toggleWarRoomTask = async (req, res, next) => {
    try {
        const { messageId, roomId, isCompleted } = req.body;
        const updated = await toggleWarRoomTaskService(messageId, roomId, isCompleted, req.user.organizationId, req.apiKey._id, req.user);
        
        // Broadcast update via Socket.IO
        emitWarRoomMessage(updated);

        return res.json(new ApiResponse(HTTP_STATUS.OK, "Task status updated", updated));
    } catch (error) {
        next(error);
    }
};

