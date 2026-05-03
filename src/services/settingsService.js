import axiosConfig from "../axios/axiosConfig";
import settingsApi from "../apis/settingsApi";

export const getSlaSettings = async () => {
  const response = await axiosConfig.get(settingsApi.SLA);
  return response.data;
};

export const updateSlaSettings = async (payload) => {
  const response = await axiosConfig.put(settingsApi.SLA, payload);
  return response.data;
};

export const getPrioritySettings = async () => {
  const response = await axiosConfig.get(settingsApi.PRIORITIES);
  return response.data;
};

export const updatePrioritySettings = async (payload) => {
  const response = await axiosConfig.put(settingsApi.PRIORITIES, payload);
  return response.data;
};

export const getWorkflowSettings = async () => {
  const response = await axiosConfig.get(settingsApi.WORKFLOW);
  return response.data;
};
