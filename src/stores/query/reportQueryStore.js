import { create } from "zustand";
import {
  getApprovalTimesReport,
  getBottlenecksReport,
  getDepartmentUsageReport,
  getOverdueRequestsReport,
  getReturnsRejectionsReport,
} from "../../services/reportService";
import { createBaseQueryStore } from "../base/createBaseQueryStore";

const createApprovalTimesQuery = createBaseQueryStore({
  dataKey: "approvalTimesReport",
  statusKey: "approvalTimesReportStatus",
  errorKey: "approvalTimesReportError",
  actionName: "fetchApprovalTimesReport",
  initialData: null,
  queryFn: getApprovalTimesReport,
});

const createBottlenecksQuery = createBaseQueryStore({
  dataKey: "bottlenecksReport",
  statusKey: "bottlenecksReportStatus",
  errorKey: "bottlenecksReportError",
  actionName: "fetchBottlenecksReport",
  initialData: [],
  queryFn: getBottlenecksReport,
  transformResponse: (response) => (Array.isArray(response) ? response : []),
});

const createDepartmentUsageQuery = createBaseQueryStore({
  dataKey: "departmentUsageReport",
  statusKey: "departmentUsageReportStatus",
  errorKey: "departmentUsageReportError",
  actionName: "fetchDepartmentUsageReport",
  initialData: [],
  queryFn: getDepartmentUsageReport,
  transformResponse: (response) => (Array.isArray(response) ? response : []),
});

const createReturnsRejectionsQuery = createBaseQueryStore({
  dataKey: "returnsRejectionsReport",
  statusKey: "returnsRejectionsReportStatus",
  errorKey: "returnsRejectionsReportError",
  actionName: "fetchReturnsRejectionsReport",
  initialData: null,
  queryFn: getReturnsRejectionsReport,
});

const createOverdueRequestsQuery = createBaseQueryStore({
  dataKey: "overdueRequestsReport",
  statusKey: "overdueRequestsReportStatus",
  errorKey: "overdueRequestsReportError",
  actionName: "fetchOverdueRequestsReport",
  initialData: [],
  queryFn: getOverdueRequestsReport,
  transformResponse: (response) => (Array.isArray(response) ? response : []),
});

export const useReportQueryStore = create((set, get) => ({
  ...createApprovalTimesQuery(set, get),
  ...createBottlenecksQuery(set, get),
  ...createDepartmentUsageQuery(set, get),
  ...createReturnsRejectionsQuery(set, get),
  ...createOverdueRequestsQuery(set, get),
}));
