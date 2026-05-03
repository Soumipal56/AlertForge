import bcrypt from "bcryptjs";

export const hashKey = async (rawKey) => {
    return await bcrypt.hash(rawKey, 12);
};

export const extractKeyId = (rawKey) => {
    return rawKey.split('.')[0] || rawKey.slice(0, 8);
};

export default hashKey;
