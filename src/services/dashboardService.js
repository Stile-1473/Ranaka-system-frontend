import axiosConfig from "../axios/axiosConfig";
import dashboardApi from "../apis/dashboardApi";

export const getDashboardSummary = async () => {
  // Backend returns a role-aware summary based on the signed-in user.
  const response = await axiosConfig.get(dashboardApi.SUMMARY);
  return response.data;
};

export const getRequestTrends = async (params = {}) => {
  const response = await axiosConfig.get(dashboardApi.REQUEST_TRENDS, { params });
  return response.data;
};

export const getPriorityDistribution = async () => {
  const response = await axiosConfig.get(dashboardApi.PRIORITY_DISTRIBUTION);
  return response.data;
};

export const getDepartmentStats = async () => {
  const response = await axiosConfig.get(dashboardApi.DEPARTMENT_STATS);
  return response.data;
};

export const getStagePerformance = async () => {
  const response = await axiosConfig.get(dashboardApi.STAGE_PERFORMANCE);
  return response.data;
};

export const getOverdueSummary = async () => {
  const response = await axiosConfig.get(dashboardApi.OVERDUE_SUMMARY);
  return response.data;
};
