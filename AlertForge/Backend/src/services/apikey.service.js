import { createApiKeyDAO } from "../dao/apikey.dao.js";

export const createApiKeyService = async (data) => {
    return await createApiKeyDAO(data);
};
