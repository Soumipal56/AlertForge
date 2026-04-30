import { createIncidentDAO, getAllIncidentsDAO } from "../dao/incident.dao.js";
export const createIncidentService = async (data) => {
    return await createIncidentDAO(data);
};

export const getAllIncidentsService = async () => {
    return await getAllIncidentsDAO();
};