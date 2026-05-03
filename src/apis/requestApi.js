// Request-related endpoint constants and builders.
const requestApi = {
  CREATE: "/requests",
  UPDATE: (id) => `/requests/${id}`,
  SUBMIT: (id) => `/requests/${id}/submit`,
  MY_REQUESTS: "/requests/my-requests",
  GET_BY_ID: (id) => `/requests/${id}`,
  COMMENTS: (id) => `/requests/${id}/comments`,
  ATTACHMENTS: (id) => `/requests/${id}/attachments`,
  CAN_ACT: (id, action) => `/requests/${id}/can-act?action=${encodeURIComponent(action)}`,
  PENDING_ADMIN: "/requests/pending/admin",
  PENDING_GM: "/requests/pending/gm",
  PENDING_CEO: "/requests/pending/ceo",
  OVERDUE: "/requests/overdue",
  APPROVAL_ACTION: (id, action) => `/requests/${id}/${action}`,
};

export default requestApi;
