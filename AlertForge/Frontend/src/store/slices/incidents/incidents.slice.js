import { createSlice } from "@reduxjs/toolkit";
import {
  fetchIncidentsThunk,
  createIncidentThunk,
  updateIncidentStatusThunk,
  updateIncidentSeverityThunk,
} from "./incidents.thunks";

const initialState = {
  list: [], // all incidents, normalized
  isLoading: false, // fetching list
  isCreating: false, // create in progress
  isUpdating: false, // status/severity patch in progress
  error: null, // last error message
  createError: null, // error specific to create form
};

const incidentsSlice = createSlice({
  name: "incidents",
  initialState,

  reducers: {
    /** Clear create form error when user edits the form */
    clearCreateError(state) {
      state.createError = null;
    },

    /** Clear list error */
    clearError(state) {
      state.error = null;
    },

    /** Optimistically patch a single incident in the list (for socket updates) */
    patchIncident(state, action) {
      const { id, ...changes } = action.payload;
      const idx = state.list.findIndex((i) => (i.id ?? i._id) === id);
      if (idx !== -1) {
        state.list[idx] = { ...state.list[idx], ...changes };
      }
    },

    /** Add a new incident to the top of the list (for socket new incident event) */
    prependIncident(state, action) {
      const exists = state.list.some((i) => i._id === action.payload._id);
      if (!exists) state.list.unshift(action.payload);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchIncidentsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIncidentsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchIncidentsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(createIncidentThunk.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createIncidentThunk.fulfilled, (state, action) => {
        state.isCreating = false;
        state.list.unshift(action.payload); // add to top of list
      })
      .addCase(createIncidentThunk.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.payload;
      });

    builder
      .addCase(updateIncidentStatusThunk.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(updateIncidentStatusThunk.fulfilled, (state, action) => {
        state.isUpdating = false;
        const idx = state.list.findIndex((i) => (i.id ?? i._id) === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateIncidentStatusThunk.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      });

    builder
      .addCase(updateIncidentSeverityThunk.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(updateIncidentSeverityThunk.fulfilled, (state, action) => {
        state.isUpdating = false;
        const idx = state.list.findIndex((i) => (i.id ?? i._id) === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateIncidentSeverityThunk.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      });
  },
});

export const { clearCreateError, clearError, patchIncident, prependIncident } =
  incidentsSlice.actions;

export default incidentsSlice.reducer;
