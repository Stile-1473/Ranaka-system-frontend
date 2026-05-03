import { create } from "zustand";
import {
  approveRequest,
  authorizeRequest,
  recommendRequest,
  rejectRequest,
  returnRequest,
} from "../../services/requestService";
import { createBaseMutationStore } from "../base/createBaseMutationStore";
import { useRequestQueryStore } from "../query/requestQueryStore";

const removeFromPendingQueue = (requestId, response) => {
  const requestStore = useRequestQueryStore.getState();
  const queue = Array.isArray(requestStore.pendingQueue)
    ? requestStore.pendingQueue
    : [];

  requestStore.setPendingQueue(
    queue.filter((request) => String(request.id) !== String(requestId))
  );
  requestStore.setRequestDetails(response);
  return response;
};

const createRecommendMutation = createBaseMutationStore({
  statusKey: "recommendStatus",
  errorKey: "recommendError",
  actionName: "recommendExistingRequest",
  mutationFn: recommendRequest,
  onSuccess: async (response, args) => removeFromPendingQueue(args[0], response),
});

const createApproveMutation = createBaseMutationStore({
  statusKey: "approveStatus",
  errorKey: "approveError",
  actionName: "approveExistingRequest",
  mutationFn: approveRequest,
  onSuccess: async (response, args) => removeFromPendingQueue(args[0], response),
});

const createAuthorizeMutation = createBaseMutationStore({
  statusKey: "authorizeStatus",
  errorKey: "authorizeError",
  actionName: "authorizeExistingRequest",
  mutationFn: authorizeRequest,
  onSuccess: async (response, args) => removeFromPendingQueue(args[0], response),
});

const createRejectMutation = createBaseMutationStore({
  statusKey: "rejectStatus",
  errorKey: "rejectError",
  actionName: "rejectExistingRequest",
  mutationFn: rejectRequest,
  onSuccess: async (response, args) => removeFromPendingQueue(args[0], response),
});

const createReturnMutation = createBaseMutationStore({
  statusKey: "returnStatus",
  errorKey: "returnError",
  actionName: "returnExistingRequest",
  mutationFn: returnRequest,
  onSuccess: async (response, args) => removeFromPendingQueue(args[0], response),
});

export const useApprovalMutationStore = create((set, get) => ({
  ...createRecommendMutation(set, get),
  ...createApproveMutation(set, get),
  ...createAuthorizeMutation(set, get),
  ...createRejectMutation(set, get),
  ...createReturnMutation(set, get),
  resetApprovalMutationState() {
    set({
      recommendStatus: "idle",
      recommendError: null,
      approveStatus: "idle",
      approveError: null,
      authorizeStatus: "idle",
      authorizeError: null,
      rejectStatus: "idle",
      rejectError: null,
      returnStatus: "idle",
      returnError: null,
    });
  },
}));
