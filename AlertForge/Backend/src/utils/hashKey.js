import crypto from "crypto";

export const hashKey = (rawKey) => {
    return crypto.createHash("sha256").update(rawKey).digest("hex");
};

export default hashKey;
