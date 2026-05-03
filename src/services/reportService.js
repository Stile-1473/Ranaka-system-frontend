import axiosConfig from "../axios/axiosConfig";
import reportApi from "../apis/reportApi";

export const getApprovalTimesReport = async (params = {}) => {
  const response = await axiosConfig.get(reportApi.APPROVAL_TIMES, { params });
  return response.data;
};

export const getBottlenecksReport = async (params = {}) => {
  const response = await axiosConfig.get(reportApi.BOTTLENECKS, { params });
  return response.data;
};

export const getDepartmentUsageReport = async (params = {}) => {
  const response = await axiosConfig.get(reportApi.DEPARTMENT_USAGE, { params });
  return response.data;
};

export const getReturnsRejectionsReport = async (params = {}) => {
  const response = await axiosConfig.get(reportApi.RETURNS_REJECTIONS, { params });
  return response.data;
};

export const getOverdueRequestsReport = async (params = {}) => {
  const response = await axiosConfig.get(reportApi.OVERDUE_REQUESTS, { params });
  return response.data;
};

export const exportReport = async ({ type, params = {} }) => {
  const response = await axiosConfig.get(reportApi.EXPORT, {
    params: { type, ...params },
    responseType: "blob",
  });

  return response.data;
};
