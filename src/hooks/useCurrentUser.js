import { useAuthQueryStore } from "../stores/query/authQueryStore";

// Tiny focused hook for components that only need the signed-in user object.
export const useCurrentUser = () =>
  useAuthQueryStore((state) => state.currentUser);
