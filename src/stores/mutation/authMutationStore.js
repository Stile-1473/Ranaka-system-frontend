import { create } from "zustand";
import { AUTH_ROLE_KEY, AUTH_TOKEN_KEY } from "../../config/constants";
import { login as loginService } from "../../services/authService";
import { storage } from "../../utils/storage";
import { useAuthQueryStore } from "../query/authQueryStore";
import { useNotificationQueryStore } from "../query/notificationQueryStore";
import { createBaseMutationStore } from "../base/createBaseMutationStore";

// Login mutation flow:
// 1. send credentials
// 2. store token + role
// 3. bootstrap current user
// 4. expose both authResponse and user to the caller
const createLoginMutation = createBaseMutationStore({
  statusKey: "loginStatus",
  errorKey: "loginError",
  actionName: "login",
  mutationFn: loginService,
  onSuccess: async (authResponse) => {
    storage.set(AUTH_TOKEN_KEY, authResponse.token);
    storage.set(AUTH_ROLE_KEY, authResponse.role);

    const user = await useAuthQueryStore.getState().bootstrapSession();
    return { authResponse, user };
  },
  onError: async () => {
    storage.remove(AUTH_TOKEN_KEY);
    storage.remove(AUTH_ROLE_KEY);
  },
});

export const useAuthMutationStore = create((set, get) => ({
  ...createLoginMutation(set, get),
  logout() {
    // Current backend auth is JWT-based, so logout is handled client-side for now.
    storage.remove(AUTH_TOKEN_KEY);
    storage.remove(AUTH_ROLE_KEY);
    useAuthQueryStore.getState().clearSession();
    useNotificationQueryStore.getState().resetNotificationsState();
    get().resetMutationState();
  },
}));
