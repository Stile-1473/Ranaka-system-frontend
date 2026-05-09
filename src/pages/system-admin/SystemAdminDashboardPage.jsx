import { useEffect, useMemo } from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "../../components/ui/Card";
import StatCard from "../../components/dashboard/StatCard";
import SkeletonBlock from "../../components/feedback/SkeletonBlock";
import { useDashboardQueryStore } from "../../stores/query/dashboardQueryStore";
import { formatDate } from "../../utils/dateFormatters";

const PRIORITY_COLORS = ["#dc2626", "#d97706", "#22c55e", "#94a3b8"];

const mapTrendData = (trends) =>
  (Array.isArray(trends) ? trends : []).map((trend) => ({
    ...trend,
    label: new Date(trend.date).toLocaleDateString("en-ZW", {
      month: "short",
      day: "numeric",
    }),
  }));

function SystemAdminDashboardPage() {
  const summary = useDashboardQueryStore((state) => state.summary);
  const fetchSummary = useDashboardQueryStore((state) => state.fetchSummary);
  const requestTrends = useDashboardQueryStore((state) => state.requestTrends);
  const requestTrendsStatus = useDashboardQueryStore(
    (state) => state.requestTrendsStatus
  );
  const fetchRequestTrends = useDashboardQueryStore(
    (state) => state.fetchRequestTrends
  );
  const priorityDistribution = useDashboardQueryStore(
    (state) => state.priorityDistribution
  );
  const fetchPriorityDistribution = useDashboardQueryStore(
    (state) => state.fetchPriorityDistribution
  );
  const departmentStats = useDashboardQueryStore((state) => state.departmentStats);
  const departmentStatsStatus = useDashboardQueryStore(
    (state) => state.departmentStatsStatus
  );
  const fetchDepartmentStats = useDashboardQueryStore(
    (state) => state.fetchDepartmentStats
  );
  const stagePerformance = useDashboardQueryStore(
    (state) => state.stagePerformance
  );
  const fetchStagePerformance = useDashboardQueryStore(
    (state) => state.fetchStagePerformance
  );
  const overdueSummary = useDashboardQueryStore((state) => state.overdueSummary);
  const fetchOverdueSummary = useDashboardQueryStore(
    (state) => state.fetchOverdueSummary
  );

  useEffect(() => {
    fetchSummary();
    fetchRequestTrends();
    fetchPriorityDistribution();
    fetchDepartmentStats();
    fetchStagePerformance();
    fetchOverdueSummary();
  }, [
    fetchDepartmentStats,
    fetchOverdueSummary,
    fetchPriorityDistribution,
    fetchRequestTrends,
    fetchStagePerformance,
    fetchSummary,
  ]);

  const trendData = useMemo(() => mapTrendData(requestTrends), [requestTrends]);

  const priorityData = useMemo(
    () =>
      [
        { name: "Critical", value: priorityDistribution?.criticalCount ?? 0 },
        { name: "High", value: priorityDistribution?.highCount ?? 0 },
        { name: "Medium", value: priorityDistribution?.mediumCount ?? 0 },
        { name: "Low", value: priorityDistribution?.lowCount ?? 0 },
      ].filter((item) => item.value > 0),
    [priorityDistribution]
  );

  const topDepartments = useMemo(
    () =>
      (Array.isArray(departmentStats) ? departmentStats : [])
        .slice()
        .sort((left, right) => Number(right.totalRequests || 0) - Number(left.totalRequests || 0))
        .slice(0, 5),
    [departmentStats]
  );

  return (
    <div className="space-y-6">
      <div className="page-action-bar">
        <div className="page-action-copy">
          <p className="section-title">Operational Oversight</p>
          <h2 className="page-action-title">Monitor workflow health, master data, and SLA risk from one control surface.</h2>
          <p className="page-action-subtitle">
            Start with the analytics that matter most: throughput, overdue pressure, stage performance, and department demand.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Requests"
          value={summary?.totalRequests ?? "--"}
          helper="Requests recorded across the platform"
        />
        <StatCard
          label="Pending"
          value={summary?.pendingRequests ?? "--"}
          tone="amber"
          helper="Requests still moving through approval"
        />
        <StatCard
          label="Completed"
          value={summary?.completedRequests ?? "--"}
          helper="Requests finished successfully"
        />
        <StatCard
          label="Overdue"
          value={summary?.overdueRequests ?? "--"}
          tone="rose"
          helper="Requests that breached SLA"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <div>
            <h3 className="panel-title">
              Workflow Trend
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Submitted, completed, returned, and rejected requests over the last 30 days.
            </p>
          </div>

          <div className="mt-6 h-80">
            {requestTrendsStatus === "loading" ? (
              <SkeletonBlock variant="chart" />
          ) : trendData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-[1.25rem] border border-dashed border-white/12 bg-white/5 text-sm text-slate-400">
                No trend data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "18px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      backgroundColor: "rgba(2, 6, 23, 0.92)",
                      color: "#f8fafc",
                      boxShadow: "0 24px 70px rgba(2, 6, 23, 0.5)",
                    }}
                    labelFormatter={(label, payload) => {
                      const point = payload?.[0]?.payload;
                      return point?.date ? formatDate(point.date) : label;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="submittedCount"
                    name="Submitted"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="completedCount"
                    name="Completed"
                    stroke="#e2e8f0"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="returnedCount"
                    name="Returned"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="rejectedCount"
                    name="Rejected"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <div>
            <h3 className="panel-title">
              Priority Mix
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Current request distribution by urgency.
            </p>
          </div>

          <div className="mt-6 h-72">
            {priorityData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-[1.25rem] border border-dashed border-white/12 bg-white/5 text-sm text-slate-400">
                No priority data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={86}
                    paddingAngle={3}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "18px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      backgroundColor: "rgba(2, 6, 23, 0.92)",
                      color: "#f8fafc",
                      boxShadow: "0 24px 70px rgba(2, 6, 23, 0.5)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 grid gap-3">
            {[
              ["Admin overdue", overdueSummary?.adminOverdueCount ?? 0],
              ["GM overdue", overdueSummary?.gmOverdueCount ?? 0],
              ["CEO overdue", overdueSummary?.ceoOverdueCount ?? 0],
              ["Critical overdue", overdueSummary?.criticalOverdueCount ?? 0],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3"
              >
                <span className="text-sm text-slate-300">{label}</span>
                <span className="text-sm font-semibold text-slate-50">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div>
            <h3 className="panel-title">
              Stage Performance
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Pending work and average handling time at each approval stage.
            </p>
          </div>

          <div className="table-shell mt-6">
            <div className="table-header-row grid grid-cols-[1.2fr_0.8fr_0.8fr] gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
              <span>Stage</span>
              <span>Pending</span>
              <span>Avg Hours</span>
            </div>
            <div className="divide-y divide-white/10">
              {(stagePerformance || []).map((stage) => (
                <div
                  key={stage.stageName}
                  className="table-data-row grid grid-cols-[1.2fr_0.8fr_0.8fr] gap-4 px-4 py-4 text-sm"
                >
                  <span className="font-medium text-slate-50">{stage.stageName}</span>
                  <span className="text-slate-300">{stage.pendingCount ?? 0}</span>
                  <span className="text-slate-300">
                    {stage.avgProcessingTimeHours?.toFixed?.(1) ?? "0.0"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div>
            <h3 className="panel-title">
              Department Activity
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Top departments by request volume and throughput.
            </p>
          </div>

          {departmentStatsStatus === "loading" ? (
            <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-10 text-sm text-slate-400">
              Loading department activity...
            </div>
          ) : topDepartments.length === 0 ? (
            <div className="mt-6 rounded-[1.25rem] border border-dashed border-white/12 bg-white/5 px-4 py-10 text-sm text-slate-400">
              No department activity available yet.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {topDepartments.map((department) => (
                <div
                  key={department.departmentName}
                  className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-50">
                        {department.departmentName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Avg approval time {department.avgApprovalTime?.toFixed?.(1) ?? "0.0"} hours
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-50">
                        {department.totalRequests ?? 0}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {department.completedRequests ?? 0} completed
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default SystemAdminDashboardPage;
