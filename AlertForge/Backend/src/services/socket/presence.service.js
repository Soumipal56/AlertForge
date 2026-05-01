/**
 * Keeps track of online sockets per room in memory.
 * This is intentionally lightweight and can be swapped for Redis later.
 */
const roomPresence = new Map();

const ensureRoom = (room) => {
    if (!roomPresence.has(room)) {
        roomPresence.set(room, new Set());
    }

    return roomPresence.get(room);
};

export const addUser = (room, socketId) => {
    const members = ensureRoom(room);
    members.add(socketId);
    return members.size;
};

export const removeUser = (room, socketId) => {
    if (!roomPresence.has(room)) {
        return 0;
    }

    const members = roomPresence.get(room);
    members.delete(socketId);

    if (members.size === 0) {
        roomPresence.delete(room);
        return 0;
    }

    return members.size;
};

export const getCount = (room) => {
    return roomPresence.get(room)?.size ?? 0;
};

export const getRoomsForSocket = (socketId) => {
    const rooms = [];

    roomPresence.forEach((members, room) => {
        if (members.has(socketId)) {
            rooms.push(room);
        }
    });

    return rooms;
};
