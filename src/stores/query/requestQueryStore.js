import { create } from "zustand";
import {
  getMyRequests,
  getPendingQueue,
  getRequestDetails,
} from "../../services/requestService";
import { createBaseQueryStore } from "../base/createBaseQueryStore";

const emptyRequestPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 10,
};

const createMyRequestsQuery = createBaseQueryStore({
  dataKey: "myRequestsPage",
  statusKey: "myRequestsStatus",
  errorKey: "myRequestsError",
  actionName: "fetchMyRequests",
  initialData: emptyRequestPage,
  queryFn: getMyRequests,
  transformResponse: (response) => ({
    ...emptyRequestPage,
    ...response,
    content: Array.isArray(response?.content) ? response.content : [],
  }),
});

const createRequestDetailsQuery = createBaseQueryStore({
  dataKey: "requestDetails",
  statusKey: "requestDetailsStatus",
  errorKey: "requestDetailsError",
  actionName: "fetchRequestDetails",
  initialData: null,
  queryFn: getRequestDetails,
});

const createPendingQueueQuery = createBaseQueryStore({
  dataKey: "pendingQueue",
  statusKey: "pendingQueueStatus",
  errorKey: "pendingQueueError",
  actionName: "fetchPendingQueue",
  initialData: [],
  queryFn: getPendingQueue,
  transformResponse: (response) => (Array.isArray(response) ? response : []),
});

export const useRequestQueryStore = create((set, get) => ({
  ...createMyRequestsQuery(set, get),
  ...createRequestDetailsQuery(set, get),
  ...createPendingQueueQuery(set, get),
}));
