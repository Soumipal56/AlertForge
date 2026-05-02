import warRoomMessageModel from "../model/WarRoomMessage.model.js";

export const createWarRoomMessageDAO = async (data) => {
    return await warRoomMessageModel.create(data);
};

export const getRecentWarRoomMessagesDAO = async (roomId, organizationId, limit = 50) => {
    const messages = await warRoomMessageModel
        .find({ roomId, organizationId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    
    return messages.reverse(); // Return in chronological order for UI
};

export const updateWarRoomTaskStatusDAO = async (messageId, organizationId, isCompleted) => {
    return await warRoomMessageModel.findOneAndUpdate(
        { _id: messageId, organizationId },
        { $set: { isCompleted } },
        { new: true }
    ).lean();
};



