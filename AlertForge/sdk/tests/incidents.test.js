// sdk/tests/incidents.test.js
import incidents from "../packages/incidents/index.js";
import logger from "../core/utils/logger.js";

export const testIncidents = async () => {
    logger.info("Running Incident Tests...");
    
    try {
        // 1. Create Incident
        const newIncident = await incidents.createIncident({
            title: "Test Incident from SDK",
            message: "This is a detailed test message",
            service: "SDK Test Service",
            severity: "P2"
        });
        const incidentId = newIncident.data?.id || newIncident.data?._id;
        if (incidentId) {
            logger.info("✔ Incident creation successful:", incidentId);
        }

        // 2. Fetch Incidents
        const list = await incidents.getIncidents();
        if (Array.isArray(list.data)) {
            logger.info("✔ Fetched incidents list successful");
        }

        // 3. Update Status
        const update = await incidents.updateStatus(incidentId, "resolved");
        if (update.success) {
            logger.info("✔ Update status successful");
        }

        return true;
    } catch (err) {
        logger.error("Incident Test Failed:", err.message);
        return false;
    }
};
