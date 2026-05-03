// Notification center endpoints.
const notificationApi = {
  MY: "/notifications/my",
  UNREAD_COUNT: "/notifications/unread-count",
  MARK_READ: (id) => `/notifications/${id}/read`,
  MARK_ALL_READ: "/notifications/read-all",
};

export default notificationApi;
