import { create } from "zustand";
import { AUTH_ROLE_KEY, AUTH_TOKEN_KEY } from "../../config/constants";
import { fetchCurrentUser } from "../../services/authService";
import { storage } from "../../utils/storage";
import { createBaseQueryStore } from "../base/createBaseQueryStore";

// Base query for restoring the current authenticated user from the backend.
// This handles the actual /auth/me call and generic success/error state.
const createBootstrapQuery = createBaseQueryStore({
  dataKey: "currentUser",
  statusKey: "sessionStatus",
  errorKey: "sessionError",
  actionName: "runBootstrapSession",
  initialData: null,
  queryFn: fetchCurrentUser,
  onSuccess: async (user, _response, _args, { set }) => {
    storage.set(AUTH_ROLE_KEY, user.role);
    set({ hasBootstrapped: true });
  },
  onError: async (_error, _args, { set }) => {
    storage.remove(AUTH_TOKEN_KEY);
    storage.remove(AUTH_ROLE_KEY);
    set({ hasBootstrapped: true, currentUser: null });
  },
});

export const useAuthQueryStore = create((set, get) => ({
  ...createBootstrapQuery(set, get),
  // Route guards use this to know whether the app has already decided
  // if a user session exists or not.
  hasBootstrapped: false,
  async bootstrapSession() {
    const token = storage.get(AUTH_TOKEN_KEY);

    if (!token) {
      // No token means there is nothing to restore, so we finish immediately.
      set({
        currentUser: null,
        sessionStatus: "idle",
        sessionError: null,
        hasBootstrapped: true,
      });
      return null;
    }

    // Token exists, so verify it and fetch the real current user.
    return get().runBootstrapSession();
  },
  setCurrentUser(user) {
    // Useful after login or any future profile-refresh flow.
    set({
      currentUser: user,
      sessionStatus: user ? "success" : "idle",
      sessionError: null,
      hasBootstrapped: true,
    });
  },
  clearSession() {
    // Clear user data while still marking the auth layer as bootstrapped.
    get().resetCurrentUser();
    set({ hasBootstrapped: true });
  },
}));
