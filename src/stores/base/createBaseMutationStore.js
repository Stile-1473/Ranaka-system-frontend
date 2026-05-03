import { extractApiErrorMessage } from "../../utils/errorHelpers";

// Generic mutation-store factory for backend-changing actions.
//
// Use cases:
// - login
// - create request
// - submit request
// - approve / reject / return
//
// This keeps mutation loading/error handling uniform across the app.
export const createBaseMutationStore = ({
  statusKey = "mutationStatus",
  errorKey = "mutationError",
  actionName = "mutate",
  mutationFn,
  rethrow = true,
  onSuccess,
  onError,
}) => {
  if (typeof mutationFn !== "function") {
    throw new Error("createBaseMutationStore requires a mutationFn");
  }

  return (set, get) => ({
    // Current mutation lifecycle state.
    [statusKey]: "idle",
    // Human-readable error for buttons, forms, and toast fallbacks.
    [errorKey]: null,

    async [actionName](...args) {
      // Enter loading state before the mutation runs.
      set({
        [statusKey]: "loading",
        [errorKey]: null,
      });

      try {
        // mutationFn is the feature-specific backend write operation.
        const response = await mutationFn(...args, { set, get });
        // onSuccess lets each mutation do custom post-processing.
        const successResult = await onSuccess?.(response, args, { set, get });

        set({
          [statusKey]: "success",
          [errorKey]: null,
        });

        return successResult ?? response;
      } catch (error) {
        const message = extractApiErrorMessage(error);

        set({
          [statusKey]: "error",
          [errorKey]: message,
        });

        // onError is useful for cleanup such as clearing stale auth tokens.
        await onError?.(error, args, { set, get });

        if (rethrow) {
          throw error;
        }

        return null;
      }
    },

    resetMutationState() {
      // Return the mutation store to a clean reusable state.
      set({
        [statusKey]: "idle",
        [errorKey]: null,
      });
    },
  });
};
