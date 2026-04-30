
let INCIDENT_DB = []; // temporary DB
/**  
 * @description Create a new incident
 * @param {Object} data - Incident data containing message, service, severity
 * @returns {Object} Created incident object
 */
export const createIncidentService = async (data) => {
    const incident = {
        id: Date.now(),
        message: data.message,
        service: data.service,
        severity: data.severity || "medium",
        status: "open",
        createdAt: new Date()
    };

    INCIDENT_DB.push(incident);
    console.log('====================================');
    console.log(INCIDENT_DB);
    console.log('====================================');
    return incident;
};