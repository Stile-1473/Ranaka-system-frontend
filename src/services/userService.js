import axiosConfig from "../axios/axiosConfig";
import userApi from "../apis/userApi";

const normalizeUser = (user) => ({
  ...user,
  isActive: Boolean(user?.isActive ?? user?.active),
});

export const getUsers = async (params = {}) => {
  const response = await axiosConfig.get(userApi.LIST, { params });
  return {
    ...response.data,
    content: Array.isArray(response.data?.content)
      ? response.data.content.map(normalizeUser)
      : [],
  };
};

export const createUser = async (payload) => {
  const response = await axiosConfig.post(userApi.CREATE, payload);
  return normalizeUser(response.data);
};

export const updateUser = async ({ userId, payload }) => {
  const response = await axiosConfig.put(userApi.UPDATE(userId), payload);
  return normalizeUser(response.data);
};

export const activateUser = async (userId) => {
  const response = await axiosConfig.patch(userApi.ACTIVATE(userId));
  return normalizeUser(response.data);
};

export const deactivateUser = async (userId) => {
  const response = await axiosConfig.patch(userApi.DEACTIVATE(userId));
  return normalizeUser(response.data);
};
