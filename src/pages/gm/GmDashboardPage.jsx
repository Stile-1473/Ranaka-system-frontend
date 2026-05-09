import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import StatCard from "../../components/dashboard/StatCard";
import SkeletonBlock from "../../components/feedback/SkeletonBlock";
import RequestQueueTable from "../../components/requests/RequestQueueTable";
import { useDashboardQueryStore } from "../../stores/query/dashboardQueryStore";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import { formatDate } from "../../utils/dateFormatters";

const mapTrendData = (trends) =>
  (Array.isArray(trends) ? trends : []).map((trend) => ({
    ...trend,
    label: new Date(trend.date).toLocaleDateString("en-ZW", {
      month: "short",
      day: "numeric",
    }),
  }));

function GmDashboardPage() {
  const summary = useDashboardQueryStore((state) => state.summary);
  const fetchSummary = useDashboardQueryStore((state) => state.fetchSummary);
  const requestTrends = useDashboardQueryStore((state) => state.requestTrends);
  const requestTrendsStatus = useDashboardQueryStore(
    (state) => state.requestTrendsStatus
  );
  const fetchRequestTrends = useDashboardQueryStore(
    (state) => state.fetchRequestTrends
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
    fetchPendingQueue("GM");
  }, [fetchPendingQueue, fetchRequestTrends, fetchSummary]);

  const recentQueue = useMemo(
    () => (Array.isArray(pendingQueue) ? pendingQueue.slice(0, 5) : []),
    [pendingQueue]
  );
  const overdueCount = useMemo(
    () => (pendingQueue || []).filter((request) => request.isOverdue).length,
    [pendingQueue]
  );
  const trendData = useMemo(() => mapTrendData(requestTrends), [requestTrends]);

  return (
    <div className="space-y-6">
      <div className="page-action-bar">
        <div className="page-action-copy">
          <p className="section-title">Management Review</p>
          <h2 className="page-action-title">Approve faster with a cleaner view of queue pressure and exceptions.</h2>
          <p className="page-action-subtitle">
            Focus on current approvals, overdue risk, and the items that are ready to move toward executive authorization.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="secondary">
            <Link to="/gm/approvals">View Queue</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Waiting"
          value={summary?.totalRequests ?? "--"}
          helper="Requests awaiting GM approval"
        />
        <StatCard
          label="Critical"
          value={summary?.pendingRequests ?? "--"}
          tone="amber"
          helper="Critical requests in the queue"
        />
        <StatCard
          label="Overdue"
          value={summary?.overdueRequests ?? "--"}
          tone="rose"
          helper="Requests beyond GM SLA"
        />
        <StatCard
          label="Currently Overdue"
          value={overdueCount}
          helper="Live overdue items in this queue"
        />
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="panel-title">Approval Trend</h3>
            <p className="mt-1 text-sm text-slate-400">
              Submitted, returned, and rejected requests over the last 30 days.
            </p>
          </div>
        </div>

        <div className="mt-6 h-80">
          {requestTrendsStatus === "loading" ? (
            <SkeletonBlock variant="chart" />
          ) : trendData.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-[1.25rem] border border-dashed border-white/12 bg-white/5 px-4 text-sm text-slate-400">
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="panel-title">Approval Queue</h3>
            <p className="mt-1 text-sm text-slate-400">
              Latest requests waiting for management approval.
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link to="/gm/approvals">Open Full Queue</Link>
          </Button>
        </div>

        <div className="mt-6">
          {pendingQueueStatus === "loading" ? (
            <SkeletonBlock rows={3} />
          ) : recentQueue.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-white/12 bg-white/5 px-4 py-8 text-sm text-slate-400">
              Nothing is waiting for GM approval right now.
            </div>
          ) : (
            <RequestQueueTable
              requests={recentQueue}
              toRequestPath={(request) => `/gm/approvals/${request.id}`}
              actionLabel="Review"
            />
          )}
        </div>
      </Card>
    </div>
  );
}

export default GmDashboardPage;
