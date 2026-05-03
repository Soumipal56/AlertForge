import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "@/services/auth.service";
//import { disconnectSocket } from "@/services/socket.service";

export const getMeThunk = createAsyncThunk(
  "auth/getMe",
  async (_, { rejectWithValue }) => {
    try {
      const user = await authApi.me();
      return user;
    } catch {
      return rejectWithValue(null);
    }
  },
);

/**
 * Login with email + password.
 * Login returns minimal info — fetches full profile right after.
 */
export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      await authApi.login({ email, password });
      const user = await authApi.me();
      return user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    }
  },
);

/**
 * Register a new account with name, email, password.
 * Register returns { apiKey } — fetches full profile right after.
 * Stores the raw apiKey in state — UI shows it once then user dismisses it.
 */
export const registerThunk = createAsyncThunk(
  "auth/register",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const data = await authApi.register({ name, email, password });
      const user = await authApi.me();
      return { user, apiKey: data.apiKey };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    }
  },
);

/**
 * Logout.
 * Clears backend cookies, disconnects socket, resets Redux state.
 * State is always reset even if the API call fails.
 */
// export const logoutThunk = createAsyncThunk("auth/logout", async () => {
//   try {
//     await authApi.logout();
//   } catch (err) {
//     console.error("[Auth] Logout API error:", err.message);
//   } finally {
//     disconnectSocket();
//   }
// });

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    isFetching: true,
    isLoading: false,
    error: null,
    apiKey: null,
  },

  reducers: {
    /**
     * User has seen and copied their new API key.
     * Call this when they click "I've copied it — dismiss".
     */
    dismissApiKey(state) {
      state.apiKey = null;
    },

    /**
     * Clear form error — call when user starts editing the login/register form.
     */
    clearAuthError(state) {
      state.error = null;
    },

    /**
     * Force logout — called when axios fires "alertforge:auth-expired".
     * Happens when both access token AND refresh token are expired.
     * Does not call the API — session is already dead.
     */
    forceLogout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.apiKey = null;
      state.error = null;
      state.isFetching = false;
      state.isLoading = false;
      //disconnectSocket();
    },

    /**
     * Patch individual user fields locally without refetching from server.
     * Use for profile edits, notification toggle updates, etc.
     */
    patchUser(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(getMeThunk.pending, (state) => {
        state.isFetching = true;
      })
      .addCase(getMeThunk.fulfilled, (state, action) => {
        state.isFetching = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getMeThunk.rejected, (state) => {
        state.isFetching = false;
        state.isAuthenticated = false;
        state.user = null;
      });

    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.apiKey = action.payload.apiKey;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // builder.addCase(logoutThunk.fulfilled, (state) => {
    //   state.user = null;
    //   state.isAuthenticated = false;
    //   state.apiKey = null;
    //   state.error = null;
    // });
  },
});

export const { dismissApiKey, clearAuthError, forceLogout, patchUser } =
  authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsFetching = (state) => state.auth.isFetching;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectApiKey = (state) => state.auth.apiKey;

export const selectUserRole = (state) => state.auth.user?.role ?? null;
export const selectIsAdmin = (state) => state.auth.user?.role === "admin";
export const selectIsResponder = (state) =>
  ["admin", "responder"].includes(state.auth.user?.role);
export const selectOrganizationId = (state) =>
  state.auth.user?.organizationId ?? null;

export default authSlice.reducer;
