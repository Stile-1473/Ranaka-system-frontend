import axiosConfig from "../axios/axiosConfig";
import requestApi from "../apis/requestApi";

export const getMyRequests = async (params = {}) => {
  // Supports page, size, sort, and direction params for request tables.
  const response = await axiosConfig.get(requestApi.MY_REQUESTS, { params });
  return response.data;
};

export const getRequestDetails = async (requestId) => {
  const response = await axiosConfig.get(requestApi.GET_BY_ID(requestId));
  return response.data;
};

export const getPendingQueue = async (role) => {
  // Simple role-driven endpoint selection for approval queue pages.
  const endpoint =
    role === "ADMIN"
      ? requestApi.PENDING_ADMIN
      : role === "GM"
        ? requestApi.PENDING_GM
        : requestApi.PENDING_CEO;

  const response = await axiosConfig.get(endpoint);
  return response.data;
};

export const recommendRequest = async (requestId, payload = {}) => {
  const response = await axiosConfig.post(
    requestApi.APPROVAL_ACTION(requestId, "recommend"),
    payload
  );
  return response.data;
};

export const approveRequest = async (requestId, payload = {}) => {
  const response = await axiosConfig.post(
    requestApi.APPROVAL_ACTION(requestId, "approve"),
    payload
  );
  return response.data;
};

export const authorizeRequest = async (requestId, payload = {}) => {
  const response = await axiosConfig.post(
    requestApi.APPROVAL_ACTION(requestId, "authorize"),
    payload
  );
  return response.data;
};

export const rejectRequest = async (requestId, payload = {}) => {
  const response = await axiosConfig.post(
    requestApi.APPROVAL_ACTION(requestId, "reject"),
    payload
  );
  return response.data;
};

export const returnRequest = async (requestId, payload = {}) => {
  const response = await axiosConfig.post(
    requestApi.APPROVAL_ACTION(requestId, "return"),
    payload
  );
  return response.data;
};

export const createRequest = async (payload) => {
  // Payload matches the backend CreateRequestDto contract.
  const response = await axiosConfig.post(requestApi.CREATE, payload);
  return response.data;
};

export const updateRequest = async (requestId, payload) => {
  const response = await axiosConfig.put(requestApi.UPDATE(requestId), payload);
  return response.data;
};

export const submitRequest = async (requestId) => {
  const response = await axiosConfig.post(requestApi.SUBMIT(requestId));
  return response.data;
};
