import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import StatCard from "../../components/dashboard/StatCard";
import InputField from "../../components/forms/InputField";
import SelectField from "../../components/forms/SelectField";
import Badge from "../../components/ui/Badge";
import { REQUEST_PRIORITIES } from "../../config/constants";
import { useDepartmentQueryStore } from "../../stores/query/departmentQueryStore";
import { useReportQueryStore } from "../../stores/query/reportQueryStore";
import { exportReport } from "../../services/reportService";
import {
  formatCurrency,
  formatEnumLabel,
  formatPriority,
  formatRequestStatus,
  formatWorkflowStage,
} from "../../utils/requestHelpers";
import { formatDate, formatDateTime } from "../../utils/dateFormatters";

const STATUS_OPTIONS = [
  "DRAFT",
  "PENDING_ADMIN_RECOMMENDATION",
  "PENDING_GM_APPROVAL",
  "PENDING_CEO_AUTHORIZATION",
  "RETURNED_FOR_CORRECTION",
  "REJECTED",
  "COMPLETED",
];

const DATE_PRESETS = [
  { label: "7 Days", days: 7 },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
];

const PRIORITY_COLORS = ["#dc2626", "#d97706", "#238b64", "#94a3b8"];

const EMPTY_FILTERS = {
  startDate: "",
  endDate: "",
  departmentId: "",
  priority: "",
  status: "",
  overdueOnly: false,
};

const formatDateInput = (date) => new Date(date).toISOString().slice(0, 10);

function ReportsPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [activePreset, setActivePreset] = useState("30 Days");

  const departments = useDepartmentQueryStore((state) => state.departments);
  const fetchDepartments = useDepartmentQueryStore((state) => state.fetchDepartments);

  const approvalTimesReport = useReportQueryStore(
    (state) => state.approvalTimesReport
  );
  const fetchApprovalTimesReport = useReportQueryStore(
    (state) => state.fetchApprovalTimesReport
  );
  const bottlenecksReport = useReportQueryStore(
    (state) => state.bottlenecksReport
  );
  const fetchBottlenecksReport = useReportQueryStore(
    (state) => state.fetchBottlenecksReport
  );
  const departmentUsageReport = useReportQueryStore(
    (state) => state.departmentUsageReport
  );
  const fetchDepartmentUsageReport = useReportQueryStore(
    (state) => state.fetchDepartmentUsageReport
  );
  const returnsRejectionsReport = useReportQueryStore(
    (state) => state.returnsRejectionsReport
  );
  const fetchReturnsRejectionsReport = useReportQueryStore(
    (state) => state.fetchReturnsRejectionsReport
  );
  const overdueRequestsReport = useReportQueryStore(
    (state) => state.overdueRequestsReport
  );
  const overdueRequestsReportStatus = useReportQueryStore(
    (state) => state.overdueRequestsReportStatus
  );
  const fetchOverdueRequestsReport = useReportQueryStore(
    (state) => state.fetchOverdueRequestsReport
  );

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 29);
    setFilters((current) => ({
      ...current,
      startDate: formatDateInput(startDate),
      endDate: formatDateInput(today),
    }));
  }, []);

  const buildFilterParams = () => {
    const params = {};

    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.departmentId) params.departmentId = Number(filters.departmentId);
    if (filters.priority) params.priority = filters.priority;
    if (filters.status) params.status = filters.status;
    if (filters.overdueOnly) params.overdueOnly = true;

    return params;
  };

  const loadReports = async (nextFilters = filters) => {
    const params = {};
    if (nextFilters.startDate) params.startDate = nextFilters.startDate;
    if (nextFilters.endDate) params.endDate = nextFilters.endDate;
    if (nextFilters.departmentId) params.departmentId = Number(nextFilters.departmentId);
    if (nextFilters.priority) params.priority = nextFilters.priority;
    if (nextFilters.status) params.status = nextFilters.status;
    if (nextFilters.overdueOnly) params.overdueOnly = true;

    await Promise.all([
      fetchApprovalTimesReport(params),
      fetchBottlenecksReport(params),
      fetchDepartmentUsageReport(params),
      fetchReturnsRejectionsReport(params),
      fetchOverdueRequestsReport(params),
    ]);
  };

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      loadReports(filters);
    }
    // We reload whenever the active filter set changes materially.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate]);

  const approvalBreakdown = useMemo(
    () => [
      {
        name: "Admin",
        hours: Number(approvalTimesReport?.adminAverageHours ?? 0),
      },
      {
        name: "GM",
        hours: Number(approvalTimesReport?.gmAverageHours ?? 0),
      },
      {
        name: "CEO",
        hours: Number(approvalTimesReport?.ceoAverageHours ?? 0),
      },
    ],
    [approvalTimesReport]
  );

  const bottleneckChartData = useMemo(
    () =>
      (bottlenecksReport || []).map((row) => ({
        stage: formatWorkflowStage(row.stageName),
        pending: Number(row.pendingCount ?? 0),
        overdue: Number(row.overdueCount ?? 0),
      })),
    [bottlenecksReport]
  );

  const departmentChartData = useMemo(
    () =>
      (departmentUsageReport || []).slice(0, 6).map((department) => ({
        name: department.departmentName,
        requests: Number(department.totalRequests ?? 0),
        completed: Number(department.completedRequests ?? 0),
      })),
    [departmentUsageReport]
  );

  const priorityMixData = useMemo(
    () =>
      REQUEST_PRIORITIES.map((priority) => ({
        name: formatPriority(priority),
        value: (overdueRequestsReport || []).filter(
          (request) => request.priority === priority
        ).length,
      })).filter((entry) => entry.value > 0),
    [overdueRequestsReport]
  );

  const exportCsv = async (type) => {
    try {
      const blob = await exportReport({ type, params: buildFilterParams() });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${type}-report.csv`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      toast.success("Report exported");
    } catch (error) {
      toast.error("Could not export report", {
        description:
          error?.response?.data?.message || "Please try again in a moment.",
      });
    }
  };

  const applyDatePreset = (days, label) => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - (days - 1));

    const nextFilters = {
      ...filters,
      startDate: formatDateInput(startDate),
      endDate: formatDateInput(today),
    };

    setActivePreset(label);
    setFilters(nextFilters);
    loadReports(nextFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Reports</h2>
          <p className="mt-1 text-sm text-slate-500">
            Faster, clearer reporting for short review periods, operational follow-up, and leadership insight.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" className="gap-2" onClick={() => loadReports()}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => exportCsv("approval-times")}
          >
            <Download className="h-4 w-4" />
            Export Summary
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant={activePreset === preset.label ? "primary" : "secondary"}
              className="px-3 py-2"
              onClick={() => applyDatePreset(preset.days, preset.label)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InputField
            label="Start date"
            type="date"
            value={filters.startDate}
            onChange={(event) => {
              setActivePreset("Custom");
              setFilters((current) => ({
                ...current,
                startDate: event.target.value,
              }));
            }}
          />
          <InputField
            label="End date"
            type="date"
            value={filters.endDate}
            onChange={(event) => {
              setActivePreset("Custom");
              setFilters((current) => ({
                ...current,
                endDate: event.target.value,
              }));
            }}
          />
          <SelectField
            label="Department"
            value={filters.departmentId}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                departmentId: event.target.value,
              }))
            }
          >
            <option value="">All departments</option>
            {(departments || []).map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Priority"
            value={filters.priority}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                priority: event.target.value,
              }))
            }
          >
            <option value="">All priorities</option>
            {REQUEST_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {formatPriority(priority)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Status"
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatRequestStatus(status)}
              </option>
            ))}
          </SelectField>
          <label className="flex items-end">
            <span className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={filters.overdueOnly}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    overdueOnly: event.target.checked,
                  }))
                }
              />
              Overdue only
            </span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => loadReports()}>Apply Filters</Button>
          <Button
            variant="secondary"
            onClick={() => {
              const today = new Date();
              const startDate = new Date();
              startDate.setDate(today.getDate() - 29);
              const nextFilters = {
                ...EMPTY_FILTERS,
                startDate: formatDateInput(startDate),
                endDate: formatDateInput(today),
              };
              setActivePreset("30 Days");
              setFilters(nextFilters);
              loadReports(nextFilters);
            }}
          >
            Reset
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Completed"
          value={approvalTimesReport?.completedRequestCount ?? "--"}
          helper="Requests included in approval-time analysis"
        />
        <StatCard
          label="Avg Hours"
          value={approvalTimesReport?.overallAverageHours?.toFixed?.(1) ?? "--"}
          helper="Overall approval turnaround"
        />
        <StatCard
          label="Returned"
          value={returnsRejectionsReport?.returnedRequests ?? "--"}
          tone="amber"
          helper={`${returnsRejectionsReport?.returnRatePercent?.toFixed?.(1) ?? "0.0"}% return rate`}
        />
        <StatCard
          label="Rejected"
          value={returnsRejectionsReport?.rejectedRequests ?? "--"}
          tone="rose"
          helper={`${returnsRejectionsReport?.rejectionRatePercent?.toFixed?.(1) ?? "0.0"}% rejection rate`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Stage Turnaround
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Average time spent in each approval stage for the selected period.
              </p>
            </div>
            <Badge variant="neutral">
              {approvalTimesReport?.startDate
                ? `${formatDate(approvalTimesReport.startDate)} - ${formatDate(
                    approvalTimesReport.endDate
                  )}`
                : "Current range"}
            </Badge>
          </div>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={approvalBreakdown} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <Bar dataKey="hours" radius={[8, 8, 0, 0]} fill="#238b64" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Overdue Priority Mix
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Which priority levels make up the current overdue workload.
              </p>
            </div>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => exportCsv("overdue-requests")}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="mt-6 h-72">
            {priorityMixData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                No overdue priority mix available for the current filters.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityMixData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={3}
                  >
                    {priorityMixData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Workflow Bottlenecks
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Pending and overdue counts by approval stage.
              </p>
            </div>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => exportCsv("bottlenecks")}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bottleneckChartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="stage"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <Bar dataKey="pending" name="Pending" fill="#238b64" radius={[8, 8, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue" fill="#dc2626" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Department Volume
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Request volume and completed throughput by department.
              </p>
            </div>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => exportCsv("department-usage")}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentChartData}
                margin={{ top: 8, right: 8, left: -24, bottom: 18 }}
              >
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <Bar dataKey="requests" name="Requests" fill="#0f172a" radius={[8, 8, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#238b64" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Top Departments
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Fast, readable operational ranking for the current filter set.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {(departmentUsageReport || []).slice(0, 6).map((department) => (
              <div
                key={department.departmentId}
                className="rounded-lg border border-slate-200 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {department.departmentName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {department.completedRequests ?? 0} completed,{" "}
                      {department.returnedRequests ?? 0} returned,{" "}
                      {department.rejectedRequests ?? 0} rejected
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {department.totalRequests ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatCurrency(department.totalEstimatedCost)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Overdue Request List
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              A short tactical list for immediate follow-up.
            </p>
          </div>

          <div className="mt-6">
            {overdueRequestsReportStatus === "loading" ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                Loading overdue requests...
              </div>
            ) : overdueRequestsReport.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                No overdue requests for the current filter set.
              </div>
            ) : (
              <div className="space-y-3">
                {overdueRequestsReport.slice(0, 6).map((request) => (
                  <div
                    key={request.requestId}
                    className="rounded-lg border border-slate-200 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="warning">
                        {formatWorkflowStage(request.currentStage)}
                      </Badge>
                      <Badge variant="danger">
                        {formatPriority(request.priority)}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      {request.title}
                    </p>
                    <div className="mt-2 grid gap-2 text-xs text-slate-500">
                      <span>{request.departmentName}</span>
                      <span>{request.requesterName}</span>
                      <span>Required by {formatDate(request.requiredByDate)}</span>
                      <span>Overdue since {formatDateTime(request.overdueAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ReportsPage;
