import warRoomMessageModel from "../model/WarRoomMessage.model.js";

export const createWarRoomMessageDAO = async (data) => {
    return await warRoomMessageModel.create(data);
};

export const getRecentWarRoomMessagesDAO = async (roomId, limit = 50) => {
    return await warRoomMessageModel
        .find({ roomId })
        .sort({ createdAt: -1 })
        .limit(limit);
};

