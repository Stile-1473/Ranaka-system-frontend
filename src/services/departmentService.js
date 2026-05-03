import axiosConfig from "../axios/axiosConfig";
import departmentApi from "../apis/departmentApi";

const normalizeDepartment = (department) => ({
  ...department,
  isActive: Boolean(department?.isActive ?? department?.active),
});

export const getActiveDepartments = async () => {
  // Request forms should only present departments that can still be used.
  const response = await axiosConfig.get(departmentApi.ACTIVE);
  return Array.isArray(response.data)
    ? response.data.map(normalizeDepartment)
    : [];
};

export const getAllDepartments = async () => {
  const response = await axiosConfig.get(departmentApi.LIST);
  return Array.isArray(response.data)
    ? response.data.map(normalizeDepartment)
    : [];
};

export const createDepartment = async (payload) => {
  const response = await axiosConfig.post(departmentApi.CREATE, payload);
  return normalizeDepartment(response.data);
};

export const updateDepartment = async ({ departmentId, payload }) => {
  const response = await axiosConfig.put(departmentApi.UPDATE(departmentId), payload);
  return normalizeDepartment(response.data);
};

export const deleteDepartment = async (departmentId) => {
  const response = await axiosConfig.delete(departmentApi.DELETE(departmentId));
  return response.data;
};
