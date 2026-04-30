import { createIncidentService } from "../services/incident.service.js";


/**  
 * @description Controller to create a new incident
 * @param {Object} req - Express request object containing incident data in body
 * @param {Object} res - Express response object to send back the created incident
 * @returns {Object} JSON response with message and created incident data
 */
export const createIncident = async (req, res) => {
    try {
        const data = req.body;

        const incident = await createIncidentService(data);
        if (!incident) {
            return res.status(400).json({ message: "Failed to create incident" });
        }
        return res.json({
            message: "Incident created",
            incident
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};