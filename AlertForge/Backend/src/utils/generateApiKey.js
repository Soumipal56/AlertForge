import crypto from "crypto";

export const generateApiKey = () => {
    return `af_${crypto.randomBytes(32).toString("hex")}`;
};

export default generateApiKey;
