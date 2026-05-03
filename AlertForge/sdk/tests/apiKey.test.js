// sdk/tests/apiKey.test.js
import { setApiKey, incidents } from "../index.js";
import logger from "../core/utils/logger.js";

export const testApiKeyFlow = async (apiKey) => {
    logger.info("Running API Key Flow Tests...");
    
    if (!apiKey) {
        logger.warn("No API Key provided for API Key test, skipping.");
        return true;
    }

    try {
        // 1. Setup API Key
        setApiKey(apiKey);
        logger.info("✔ API Key configured");

        // 2. Test Incident Creation with API Key
        const newIncident = await incidents.createIncident({
            title: "Incident created via SDK API Key",
            message: "Testing the raw API Key flow",
            service: "SDK Security Service",
            severity: "P1"
        });

        if (newIncident.success) {
            logger.info("✔ Incident creation via API Key successful");
        }

        return true;
    } catch (err) {
        logger.error("API Key Test Failed:", err.message);
        return false;
    }
};
