import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
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
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import StatCard from "../../components/dashboard/StatCard";
import SkeletonBlock from "../../components/feedback/SkeletonBlock";
import RequestQueueTable from "../../components/requests/RequestQueueTable";
import { useDashboardQueryStore } from "../../stores/query/dashboardQueryStore";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import { formatDate, formatDateTime } from "../../utils/dateFormatters";
import { formatCurrency } from "../../utils/requestHelpers";

const PRIORITY_COLORS = ["#dc2626", "#d97706", "#22c55e", "#94a3b8"];

const mapTrendData = (trends) =>
  (Array.isArray(trends) ? trends : []).map((trend) => ({
    ...trend,
    label: new Date(trend.date).toLocaleDateString("en-ZW", {
      month: "short",
      day: "numeric",
    }),
  }));

function AdminDashboardPage() {
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
  const overdueSummary = useDashboardQueryStore((state) => state.overdueSummary);
  const fetchOverdueSummary = useDashboardQueryStore(
    (state) => state.fetchOverdueSummary
  );
  const pendingQueue = useRequestQueryStore((state) => state.pendingQueue);
  const pendingQueueStatus = useRequestQueryStore(
    (state) => state.pendingQueueStatus
  );
  const fetchPendingQueue = useRequestQueryStore(
    (state) => state.fetchPendingQueue
  );

  useEffect(() => {
    fetchSummary();
    fetchRequestTrends();
    fetchPriorityDistribution();
    fetchOverdueSummary();
    fetchPendingQueue("ADMIN");
  }, [
    fetchOverdueSummary,
    fetchPendingQueue,
    fetchPriorityDistribution,
    fetchRequestTrends,
    fetchSummary,
  ]);

  const queue = Array.isArray(pendingQueue) ? pendingQueue : [];

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

  const returnedCount = useMemo(
    () => queue.filter((request) => Number(request.returnCount || 0) > 0).length,
    [queue]
  );

  const criticalCount = useMemo(
    () => queue.filter((request) => request.priority === "CRITICAL").length,
    [queue]
  );

  const overdueCount = useMemo(
    () => queue.filter((request) => request.isOverdue).length,
    [queue]
  );

  const queueSnapshot = useMemo(() => queue.slice(0, 5), [queue]);

  const nextForReview = useMemo(
    () =>
      queue
        .slice()
        .sort((left, right) => {
          if (left.isOverdue !== right.isOverdue) {
            return Number(right.isOverdue) - Number(left.isOverdue);
          }

          const priorityRank = {
            CRITICAL: 4,
            HIGH: 3,
            MEDIUM: 2,
            LOW: 1,
          };

          const priorityDelta =
            (priorityRank[right.priority] || 0) - (priorityRank[left.priority] || 0);

          if (priorityDelta !== 0) {
            return priorityDelta;
          }

          return (
            new Date(left.requiredByDate || left.createdAt) -
            new Date(right.requiredByDate || right.createdAt)
          );
        })
        .slice(0, 4),
    [queue]
  );

  const overdueBreakdown = [
    ["Admin overdue", overdueSummary?.adminOverdueCount ?? 0],
    ["GM overdue", overdueSummary?.gmOverdueCount ?? 0],
    ["CEO overdue", overdueSummary?.ceoOverdueCount ?? 0],
    ["Critical overdue", overdueSummary?.criticalOverdueCount ?? 0],
  ];

  return (
    <div className="space-y-6">
      <div className="page-action-bar">
        <div className="page-action-copy">
          <p className="section-title">Admin Oversight</p>
          <h2 className="page-action-title">
            Control recommendation workload, spot urgency early, and move clean requests forward fast.
          </h2>
          <p className="page-action-subtitle">
            This dashboard stays focused on real admin work: queue pressure, urgent demand, overdue exposure, and the next requests that need a decision.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="secondary">
            <Link to="/admin/overdue">View Overdue</Link>
          </Button>
          <Button asChild>
            <Link to="/admin/recommendations">Open Queue</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Queue Waiting"
          value={queue.length}
          helper="Requests currently waiting for recommendation"
        />
        <StatCard
          label="Critical"
          value={criticalCount}
          tone="amber"
          helper="Critical requests needing quick review"
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          tone="rose"
          helper="Queue items already beyond target time"
        />
        <StatCard
          label="Returned Before"
          value={returnedCount}
          helper="Requests that have already been sent back once"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr] xl:items-start">
        <Card>
          <div>
            <h3 className="panel-title">Recommendation Trend</h3>
            <p className="mt-1 text-sm text-slate-400">
              Submitted, returned, and rejected request movement over the last 30 days.
            </p>
          </div>

          <div className="mt-6 h-64 xl:h-[25rem]">
            {requestTrendsStatus === "loading" ? (
              <SkeletonBlock variant="chart" />
            ) : trendData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-[1.25rem] border border-dashed border-white/12 bg-white/5 px-4 text-sm text-slate-400">
                No trend data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
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

        <div className="space-y-6">
          <Card>
            <div>
              <h3 className="panel-title">Queue Pressure</h3>
              <p className="mt-1 text-sm text-slate-400">
                Current urgency mix and overdue exposure across the workflow.
              </p>
            </div>

            <div className="mt-6 h-56">
              {priorityData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-[1.25rem] border border-dashed border-white/12 bg-white/5 px-4 text-sm text-slate-400">
                  No priority distribution available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={78}
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
              {overdueBreakdown.map(([label, value]) => (
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

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="panel-title">Next For Review</h3>
                <p className="mt-1 text-sm text-slate-400">
                  The requests that need attention first.
                </p>
              </div>
              <Button asChild variant="secondary" className="shrink-0">
                <Link to="/admin/recommendations">Full Queue</Link>
              </Button>
            </div>

            {pendingQueueStatus === "loading" ? (
              <div className="mt-6">
                <SkeletonBlock rows={4} />
              </div>
            ) : nextForReview.length === 0 ? (
              <div className="mt-6 rounded-[1.25rem] border border-dashed border-white/12 bg-white/5 px-4 py-8 text-sm text-slate-400">
                Nothing is waiting for admin recommendation right now.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {nextForReview.map((request) => (
                  <Link
                    key={request.id}
                    to={`/admin/recommendations/${request.id}`}
                    className="block rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-50">
                          {request.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {request.requesterName || "Requester"} •{" "}
                          {request.departmentName || "No department"}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-emerald-300">
                        Open
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>{formatDate(request.requiredByDate)}</span>
                      <span>{formatCurrency(request.estimatedCost)}</span>
                      <span>{formatDateTime(request.submittedAt || request.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="panel-title">Queue Snapshot</h3>
            <p className="mt-1 text-sm text-slate-400">
              A compact view of the latest requests waiting for admin review.
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link to="/admin/recommendations">Open Full Queue</Link>
          </Button>
        </div>

        <div className="mt-6">
          {pendingQueueStatus === "loading" ? (
            <SkeletonBlock rows={3} />
          ) : queueSnapshot.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-white/12 bg-white/5 px-4 py-8 text-sm text-slate-400">
              Nothing is waiting for admin recommendation right now.
            </div>
          ) : (
            <RequestQueueTable
              requests={queueSnapshot}
              toRequestPath={(request) => `/admin/recommendations/${request.id}`}
              actionLabel="Review"
            />
          )}
        </div>
      </Card>
    </div>
  );
}

export default AdminDashboardPage;
