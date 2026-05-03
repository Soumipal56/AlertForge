import { createAsyncThunk } from "@reduxjs/toolkit";
import { incidentApi, normalizeIncident } from "@/services/incidents.service";

/** Fetch all incidents and normalize them */
export const fetchIncidentsThunk = createAsyncThunk(
    "incidents/fetchAll",
    async (_, { rejectWithValue }) => {
      try {
        const data = await incidentApi.getAll();
        const raw = Array.isArray(data) ? data : (data?.incidents ?? []);
        return raw.map(normalizeIncident);
      } catch (err) {
        return rejectWithValue(
          err.response?.data?.message ?? "Failed to fetch incidents"
        );
      }
    }
  );

/** Create a new incident */
export const createIncidentThunk = createAsyncThunk(
  "incidents/create",
  async ({ title, service, severity }, { rejectWithValue }) => {
    try {
      const data = await incidentApi.create({ title, service, severity });
      const raw = data.incident ?? data;
      return normalizeIncident(raw);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to create incident"
      );
    }
  }
);

/** Update incident status — responder or above */
export const updateIncidentStatusThunk = createAsyncThunk(
  "incidents/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const data = await incidentApi.updateStatus(id, status);
      const raw = data.incident ?? data;
      return normalizeIncident(raw);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to update status"
      );
    }
  }
);

/** Update incident severity — admin only */
export const updateIncidentSeverityThunk = createAsyncThunk(
  "incidents/updateSeverity",
  async ({ id, severity }, { rejectWithValue }) => {
    try {
      const data = await incidentApi.updateSeverity(id, severity);
      const raw = data.incident ?? data;
      return normalizeIncident(raw);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to update severity"
      );
    }
  }
);