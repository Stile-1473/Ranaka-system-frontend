// User management endpoints for system administration features.
const userApi = {
  LIST: "/users",
  CREATE: "/users",
  GET_BY_ID: (id) => `/users/${id}`,
  UPDATE: (id) => `/users/${id}`,
  CHANGE_PASSWORD: (id) => `/users/${id}/change-password`,
  ACTIVATE: (id) => `/users/${id}/activate`,
  DEACTIVATE: (id) => `/users/${id}/deactivate`,
  GET_BY_ROLE: (role) => `/users/role/${role}`,
  COUNT_ACTIVE_BY_ROLE: (role) => `/users/count/active/${role}`,
};

export default userApi;
