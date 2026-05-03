import { useAuthQueryStore } from "../stores/query/authQueryStore";
import { useAuthMutationStore } from "../stores/mutation/authMutationStore";

// Convenience hook that combines auth query state and auth mutation state.
// This keeps components cleaner because they do not need to know which store
// owns which piece of auth behavior.
export const useAuth = () => {
  const currentUser = useAuthQueryStore((state) => state.currentUser);
  const sessionStatus = useAuthQueryStore((state) => state.sessionStatus);
  const hasBootstrapped = useAuthQueryStore((state) => state.hasBootstrapped);
  const login = useAuthMutationStore((state) => state.login);
  const logout = useAuthMutationStore((state) => state.logout);
  const loginStatus = useAuthMutationStore((state) => state.loginStatus);
  const loginError = useAuthMutationStore((state) => state.loginError);

  return {
    currentUser,
    sessionStatus,
    hasBootstrapped,
    login,
    logout,
    loginStatus,
    loginError,
    // Derived convenience flag used heavily by route guards and layout logic.
    isAuthenticated: Boolean(currentUser),
  };
};
