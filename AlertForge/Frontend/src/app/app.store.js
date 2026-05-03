import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/slices/authSlice";
import incidentsReducer from "@/store/slices/incidents/incidents.slice";
import { forceLogout } from "@/store/slices/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    incidents: incidentsReducer,
  },
});

// When axios interceptor fires this event (refresh token expired),
// force logout the user and clear Redux state
window.addEventListener("alertforge:auth-expired", () => {
  store.dispatch(forceLogout());
});