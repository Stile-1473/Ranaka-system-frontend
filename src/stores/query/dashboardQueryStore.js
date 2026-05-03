import { create } from "zustand";
import {
  getDepartmentStats,
  getDashboardSummary,
  getOverdueSummary,
  getPriorityDistribution,
  getRequestTrends,
  getStagePerformance,
} from "../../services/dashboardService";
import { createBaseQueryStore } from "../base/createBaseQueryStore";

// Query store for top-level dashboard summary cards.
const createSummaryQuery = createBaseQueryStore({
  dataKey: "summary",
  statusKey: "summaryStatus",
  errorKey: "summaryError",
  actionName: "fetchSummary",
  initialData: null,
  queryFn: getDashboardSummary,
});

const createRequestTrendsQuery = createBaseQueryStore({
  dataKey: "requestTrends",
  statusKey: "requestTrendsStatus",
  errorKey: "requestTrendsError",
  actionName: "fetchRequestTrends",
  initialData: [],
  queryFn: getRequestTrends,
  transformResponse: (response) => (Array.isArray(response) ? response : []),
});

const createPriorityDistributionQuery = createBaseQueryStore({
  dataKey: "priorityDistribution",
  statusKey: "priorityDistributionStatus",
  errorKey: "priorityDistributionError",
  actionName: "fetchPriorityDistribution",
  initialData: null,
  queryFn: getPriorityDistribution,
});

const createDepartmentStatsQuery = createBaseQueryStore({
  dataKey: "departmentStats",
  statusKey: "departmentStatsStatus",
  errorKey: "departmentStatsError",
  actionName: "fetchDepartmentStats",
  initialData: [],
  queryFn: getDepartmentStats,
  transformResponse: (response) => (Array.isArray(response) ? response : []),
});

const createStagePerformanceQuery = createBaseQueryStore({
  dataKey: "stagePerformance",
  statusKey: "stagePerformanceStatus",
  errorKey: "stagePerformanceError",
  actionName: "fetchStagePerformance",
  initialData: [],
  queryFn: getStagePerformance,
  transformResponse: (response) => (Array.isArray(response) ? response : []),
});

const createOverdueSummaryQuery = createBaseQueryStore({
  dataKey: "overdueSummary",
  statusKey: "overdueSummaryStatus",
  errorKey: "overdueSummaryError",
  actionName: "fetchOverdueSummary",
  initialData: null,
  queryFn: getOverdueSummary,
});

export const useDashboardQueryStore = create((set, get) => ({
  ...createSummaryQuery(set, get),
  ...createRequestTrendsQuery(set, get),
  ...createPriorityDistributionQuery(set, get),
  ...createDepartmentStatsQuery(set, get),
  ...createStagePerformanceQuery(set, get),
  ...createOverdueSummaryQuery(set, get),
}));
