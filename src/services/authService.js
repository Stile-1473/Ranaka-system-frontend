import axiosConfig from "../axios/axiosConfig";
import authApi from "../apis/authApi";

// Service functions stay intentionally thin:
// they only perform HTTP work and return response.data.
export const login = async (credentials) => {
  const response = await axiosConfig.post(authApi.LOGIN, credentials);
  return response.data;
};

export const fetchCurrentUser = async () => {
  // Used after login and also during app startup to restore the session.
  const response = await axiosConfig.get(authApi.ME);
  return response.data;
};

export const updateCurrentUser = async (payload) => {
  const response = await axiosConfig.put(authApi.UPDATE_ME, payload);
  return response.data;
};

export const changePassword = async (payload) => {
  const response = await axiosConfig.post(authApi.CHANGE_PASSWORD, payload);
  return response.data;
};
