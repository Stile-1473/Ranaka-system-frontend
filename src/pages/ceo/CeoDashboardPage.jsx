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
import RequestPriorityBadge from "../../components/requests/RequestPriorityBadge";
import RequestStatusBadge from "../../components/requests/RequestStatusBadge";
import { useDashboardQueryStore } from "../../stores/query/dashboardQueryStore";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import { formatCurrency, formatWorkflowStage } from "../../utils/requestHelpers";
import { formatDate, formatDateTime } from "../../utils/dateFormatters";

const mapTrendData = (trends) =>
  (Array.isArray(trends) ? trends : []).map((trend) => ({
    ...trend,
    label: new Date(trend.date).toLocaleDateString("en-ZW", {
      month: "short",
      day: "numeric",
    }),
  }));

function CeoDashboardPage() {
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
    fetchPendingQueue("CEO");
  }, [fetchPendingQueue, fetchRequestTrends, fetchSummary]);

  const recentQueue = useMemo(
    () => (Array.isArray(pendingQueue) ? pendingQueue.slice(0, 5) : []),
    [pendingQueue]
  );
  const criticalCount = useMemo(
    () => (pendingQueue || []).filter((request) => request.priority === "CRITICAL").length,
    [pendingQueue]
  );
  const trendData = useMemo(() => mapTrendData(requestTrends), [requestTrends]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">CEO Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review final authorizations, prioritise critical items, and complete the approval chain.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="secondary">
            <Link to="/ceo/authorizations">View Queue</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Waiting"
          value={summary?.totalRequests ?? "--"}
          helper="Requests awaiting final authorization"
        />
        <StatCard
          label="High Value"
          value={summary?.pendingRequests ?? "--"}
          tone="amber"
          helper="Requests above executive threshold"
        />
        <StatCard
          label="Overdue"
          value={summary?.overdueRequests ?? "--"}
          tone="rose"
          helper="Requests beyond CEO SLA"
        />
        <StatCard
          label="Critical"
          value={criticalCount}
          helper="Critical requests in the queue"
        />
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Authorization Trend</h3>
            <p className="mt-1 text-sm text-slate-500">
              Submitted, returned, and rejected requests over the last 30 days.
            </p>
          </div>
        </div>

        <div className="mt-6 h-80">
          {requestTrendsStatus === "loading" ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
              Loading trend data...
            </div>
          ) : trendData.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-sm text-slate-500">
              No trend data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
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
                  labelFormatter={(label, payload) => {
                    const point = payload?.[0]?.payload;
                    return point?.date ? formatDate(point.date) : label;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="submittedCount"
                  name="Submitted"
                  stroke="#238b64"
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
            <h3 className="text-lg font-semibold text-slate-900">Authorization Queue</h3>
            <p className="mt-1 text-sm text-slate-500">
              Latest requests waiting for executive authorization.
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link to="/ceo/authorizations">Open Full Queue</Link>
          </Button>
        </div>

        <div className="mt-6">
          {pendingQueueStatus === "loading" ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Loading CEO queue...
            </div>
          ) : recentQueue.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Nothing is waiting for CEO authorization right now.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="hidden grid-cols-[minmax(0,1.6fr)_0.9fr_0.9fr_0.9fr_0.9fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:grid">
                <span>Request</span>
                <span>Requester</span>
                <span>Due Date</span>
                <span>Amount</span>
                <span className="text-right">Action</span>
              </div>

              <div className="divide-y divide-slate-200">
                {recentQueue.map((request) => (
                  <Link
                    key={request.id}
                    to={`/ceo/authorizations/${request.id}`}
                    className="block px-4 py-4 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.6fr)_0.9fr_0.9fr_0.9fr_0.9fr] lg:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {request.title}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <RequestStatusBadge
                            status={request.status}
                            isOverdue={request.isOverdue}
                          />
                          <RequestPriorityBadge priority={request.priority} />
                          <span className="text-xs text-slate-500">
                            {request.departmentName}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-slate-600">
                        {request.requesterName}
                      </div>

                      <div className="text-sm text-slate-600">
                        <div>{formatDate(request.requiredByDate)}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {formatWorkflowStage(request.currentStage)}
                        </div>
                      </div>

                      <div className="text-sm text-slate-900">
                        <div className="font-semibold">
                          {formatCurrency(request.estimatedCost)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {request.submittedAt
                            ? formatDateTime(request.submittedAt)
                            : formatDateTime(request.createdAt)}
                        </div>
                      </div>

                      <div className="text-sm font-medium text-brand-700 lg:text-right">
                        Review
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default CeoDashboardPage;
