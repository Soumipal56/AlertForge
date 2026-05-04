import { createSelector } from "@reduxjs/toolkit";

export const selectAllIncidents     = (state) => state.incidents?.list || [];

export const selectIncidentsLoading = (state) => state.incidents.isLoading;
export const selectIncidentsCreating = (state) => state.incidents.isCreating;
export const selectIncidentsUpdating = (state) => state.incidents.isUpdating;
export const selectIncidentsError   = (state) => state.incidents.error;
export const selectCreateError      = (state) => state.incidents.createError;

/** Single incident by id */
export const selectIncidentById = (id) => (state) =>
  state.incidents.list.find((i) => i.id === id) ?? null;

/** Counts per status — used for tab badges */
export const selectIncidentCounts = createSelector(
  selectAllIncidents,
  (list) => ({
    active:        list.filter((i) => i.status === "Active").length,
    investigating: list.filter((i) => i.status === "Investigating").length,
    monitoring:    list.filter((i) => i.status === "Monitoring").length,
    resolved:      list.filter((i) => i.status === "Resolved").length,
    total:         list.length,
  })
);

/** Active incidents only — used for sidebar badge */
export const selectActiveIncidents = createSelector(
  selectAllIncidents,
  (list) => list.filter((i) => i.status !== "Resolved")
);