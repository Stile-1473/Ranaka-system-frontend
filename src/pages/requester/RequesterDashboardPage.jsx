import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import StatCard from "../../components/dashboard/StatCard";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import RequestPriorityBadge from "../../components/requests/RequestPriorityBadge";
import RequestStatusBadge from "../../components/requests/RequestStatusBadge";
import { useDashboardQueryStore } from "../../stores/query/dashboardQueryStore";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import { formatCurrency } from "../../utils/requestHelpers";
import { formatDate, formatDateTime } from "../../utils/dateFormatters";

const buildTrendData = (requests) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const countsByDate = (requests || []).reduce((accumulator, request) => {
    const sourceDate = request.submittedAt || request.createdAt;

    if (!sourceDate) {
      return accumulator;
    }

    const key = new Date(sourceDate).toISOString().slice(0, 10);
    accumulator.set(key, (accumulator.get(key) || 0) + 1);
    return accumulator;
  }, new Map());

  return Array.from({ length: 7 }, (_, index) => {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - (6 - index));
    const key = currentDate.toISOString().slice(0, 10);

    return {
      date: key,
      label: currentDate.toLocaleDateString("en-ZW", {
        month: "short",
        day: "numeric",
      }),
      requests: countsByDate.get(key) || 0,
    };
  });
};

function RequesterDashboardPage() {
  const summary = useDashboardQueryStore((state) => state.summary);
  const fetchSummary = useDashboardQueryStore((state) => state.fetchSummary);
  const myRequestsPage = useRequestQueryStore((state) => state.myRequestsPage);
  const myRequestsStatus = useRequestQueryStore((state) => state.myRequestsStatus);
  const fetchMyRequests = useRequestQueryStore((state) => state.fetchMyRequests);

  useEffect(() => {
    fetchSummary();
    fetchMyRequests({
      page: 0,
      size: 50,
      sort: "createdAt",
      direction: "desc",
    });
  }, [fetchMyRequests, fetchSummary]);

  const allRequests = myRequestsPage?.content ?? [];
  const recentRequests = allRequests.slice(0, 5);
  const trendData = buildTrendData(allRequests);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Requester Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            View request activity, track progress, and start a new request.
          </p>
        </div>
        <Button asChild>
          <Link to="/requests/new">New Request</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Requests" value={summary?.totalRequests ?? "--"} />
        <StatCard label="Pending" value={summary?.pendingRequests ?? "--"} tone="amber" />
        <StatCard label="Returned" value={summary?.returnedRequests ?? "--"} />
        <StatCard label="Completed" value={summary?.completedRequests ?? "--"} />
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Request Activity</h3>
            <p className="mt-1 text-sm text-slate-500">
              Requests created or submitted over the last 7 days.
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link to="/requests">Open My Requests</Link>
          </Button>
        </div>

        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="requestActivityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#238b64" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#238b64" stopOpacity={0.02} />
                </linearGradient>
              </defs>
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
                formatter={(value) => [`${value}`, "Requests"]}
                labelFormatter={(label, payload) => {
                  const point = payload?.[0]?.payload;
                  return point?.date ? formatDate(point.date) : label;
                }}
              />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="#238b64"
                strokeWidth={2}
                fill="url(#requestActivityFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Recent Requests</h3>
            <p className="mt-1 text-sm text-slate-500">
              Your latest drafts and submissions.
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link to="/requests">View All</Link>
          </Button>
        </div>

        <div className="mt-6">
          {myRequestsStatus === "loading" ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Loading your recent requests...
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              No requests yet. Your first draft will appear here once created.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
              {recentRequests.map((request) => (
                <Link
                  key={request.id}
                  to={`/requests/${request.id}`}
                  className="block px-4 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {request.title}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <RequestStatusBadge
                          status={request.status}
                          isOverdue={request.isOverdue}
                        />
                        <RequestPriorityBadge priority={request.priority} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>{request.departmentName || "No department"}</span>
                        <span>{request.currentStage || "Not yet submitted"}</span>
                      </div>
                    </div>
                    <div className="text-sm lg:text-right">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(request.estimatedCost)}
                      </p>
                      <p className="mt-1 text-slate-500">
                        {request.submittedAt
                          ? `Submitted ${formatDateTime(request.submittedAt)}`
                          : `Drafted ${formatDateTime(request.createdAt)}`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default RequesterDashboardPage;
