import { create } from "zustand";
import {
  createRequest,
  submitRequest,
  updateRequest,
} from "../../services/requestService";
import { createBaseMutationStore } from "../base/createBaseMutationStore";

const createDraftMutation = createBaseMutationStore({
  statusKey: "createRequestStatus",
  errorKey: "createRequestError",
  actionName: "createDraftRequest",
  mutationFn: createRequest,
});

const createSubmitMutation = createBaseMutationStore({
  statusKey: "submitRequestStatus",
  errorKey: "submitRequestError",
  actionName: "submitExistingRequest",
  mutationFn: submitRequest,
});

const createUpdateMutation = createBaseMutationStore({
  statusKey: "updateRequestStatus",
  errorKey: "updateRequestError",
  actionName: "updateExistingRequest",
  mutationFn: updateRequest,
});

export const useRequestMutationStore = create((set, get) => ({
  ...createDraftMutation(set, get),
  ...createSubmitMutation(set, get),
  ...createUpdateMutation(set, get),

  resetCreateRequestState() {
    set({
      createRequestStatus: "idle",
      createRequestError: null,
    });
  },

  resetSubmitRequestState() {
    set({
      submitRequestStatus: "idle",
      submitRequestError: null,
    });
  },

  resetUpdateRequestState() {
    set({
      updateRequestStatus: "idle",
      updateRequestError: null,
    });
  },

  resetRequestMutationState() {
    get().resetCreateRequestState();
    get().resetSubmitRequestState();
    get().resetUpdateRequestState();
  },
}));
