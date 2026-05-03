import { extractApiErrorMessage } from "../../utils/errorHelpers";

// Helper used to generate readable action names such as:
// - setSummary / resetSummary
// - setCurrentUser / resetCurrentUser
const capitalize = (value) =>
  `${String(value).charAt(0).toUpperCase()}${String(value).slice(1)}`;

// Generic query-store factory for Zustand.
//
// Why this exists:
// most read-only frontend stores repeat the same lifecycle:
// 1. start loading
// 2. call a service
// 3. store result
// 4. handle errors consistently
// 5. optionally run side effects
//
// This helper keeps that pattern centralized and consistent.
export const createBaseQueryStore = ({
  dataKey = "data",
  statusKey = "status",
  errorKey = "error",
  actionName = "runQuery",
  initialData = null,
  queryFn,
  transformResponse = (response) => response,
  preserveDataOnLoad = true,
  clearErrorOnLoad = true,
  rethrow = false,
  onSuccess,
  onError,
}) => {
  if (typeof queryFn !== "function") {
    throw new Error("createBaseQueryStore requires a queryFn");
  }

  // Generate ergonomic store helpers based on the chosen data key.
  const setDataAction = `set${capitalize(dataKey)}`;
  const resetAction = `reset${capitalize(dataKey)}`;

  return (set, get) => ({
    // Main query result, for example currentUser, summary, or unreadCount.
    [dataKey]: initialData,
    // Standard async lifecycle state.
    [statusKey]: "idle",
    // Human-readable error message safe for toasts or inline UI.
    [errorKey]: null,

    async [actionName](...args) {
      // Enter loading state before making the service call.
      set({
        ...(preserveDataOnLoad ? {} : { [dataKey]: initialData }),
        [statusKey]: "loading",
        ...(clearErrorOnLoad ? { [errorKey]: null } : {}),
      });

      try {
        // queryFn is the feature-specific async operation.
        const response = await queryFn(...args, { set, get });
        // transformResponse lets a store reduce or reshape the raw service output.
        const nextData = transformResponse(response, ...args);

        set({
          [dataKey]: nextData,
          [statusKey]: "success",
          [errorKey]: null,
        });

        // Optional side effect hook for query-specific logic.
        const successResult = await onSuccess?.(nextData, response, args, { set, get });
        return successResult ?? nextData;
      } catch (error) {
        const message = extractApiErrorMessage(error);

        set({
          [statusKey]: "error",
          [errorKey]: message,
        });

        // Optional failure hook for cleanup or extra handling.
        await onError?.(error, args, { set, get });

        if (rethrow) {
          throw error;
        }

        return null;
      }
    },

    [setDataAction](value) {
      // Manual setter for local updates without re-fetching from the backend.
      set({ [dataKey]: value });
    },

    [resetAction]() {
      // Full reset to the store's original baseline.
      set({
        [dataKey]: initialData,
        [statusKey]: "idle",
        [errorKey]: null,
      });
    },
  });
};
