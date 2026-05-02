import { createApiKeyDAO, deactivateActiveApiKeysByUserDAO } from "../dao/apikey.dao.js";

export const createApiKeyService = async (data) => {
    await deactivateActiveApiKeysByUserDAO(data.user);
    return await createApiKeyDAO(data);
};
