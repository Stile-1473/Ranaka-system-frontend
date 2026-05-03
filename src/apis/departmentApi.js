// Department endpoints used by requester forms and system admin screens.
const departmentApi = {
  LIST: "/departments",
  ACTIVE: "/departments/active",
  GET_BY_ID: (id) => `/departments/${id}`,
  CREATE: "/departments",
  UPDATE: (id) => `/departments/${id}`,
  DELETE: (id) => `/departments/${id}`,
};

export default departmentApi;
