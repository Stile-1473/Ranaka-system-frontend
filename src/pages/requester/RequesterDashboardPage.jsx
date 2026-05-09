import { useEffect, useMemo } from "react";
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
import SkeletonBlock from "../../components/feedback/SkeletonBlock";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import RequestPriorityBadge from "../../components/requests/RequestPriorityBadge";
import RequestStatusBadge from "../../components/requests/RequestStatusBadge";
import { useDashboardQueryStore } from "../../stores/query/dashboardQueryStore";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import {
  formatCurrency,
  formatWorkflowStage,
  getRequestNextStep,
} from "../../utils/requestHelpers";
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
  const trendData = useMemo(() => buildTrendData(allRequests), [allRequests]);

  const draftCount = useMemo(
    () => allRequests.filter((request) => request.status === "DRAFT").length,
    [allRequests]
  );

  const actionRequests = useMemo(
    () =>
      allRequests.filter(
        (request) =>
          ["RETURNED_FOR_CORRECTION", "DRAFT"].includes(request.status) ||
          request.isOverdue
      ),
    [allRequests]
  );

  const recentRequests = useMemo(() => allRequests.slice(0, 6), [allRequests]);

  const progressCounts = useMemo(
    () => ({
      admin: allRequests.filter(
        (request) =>
          request.currentStage === "ADMIN_RECOMMENDATION" ||
          request.status === "PENDING_ADMIN_RECOMMENDATION"
      ).length,
      gm: allRequests.filter(
        (request) =>
          request.currentStage === "GM_APPROVAL" ||
          request.status === "PENDING_GM_APPROVAL"
      ).length,
      ceo: allRequests.filter(
        (request) =>
          request.currentStage === "CEO_AUTHORIZATION" ||
          request.status === "PENDING_CEO_AUTHORIZATION"
      ).length,
    }),
    [allRequests]
  );

  return (
    <div className="space-y-6">
      <div className="page-action-bar">
        <div className="page-action-copy">
          <p className="section-title">Requester Workspace</p>
          <h2 className="page-action-title">Create requests, resolve returns, and track live approval movement.</h2>
          <p className="page-action-subtitle">
            Start from what matters now: pending work, current queue position, and the latest request activity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="secondary">
            <Link to="/requests">View My Requests</Link>
          </Button>
          <Button asChild>
            <Link to="/requests/new">New Request</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Requests" value={summary?.totalRequests ?? "--"} />
        <StatCard
          label="Drafts"
          value={draftCount}
          helper="Requests still being prepared"
        />
        <StatCard
          label="Waiting for Review"
          value={summary?.pendingRequests ?? "--"}
          tone="amber"
          helper="Requests moving through approval"
        />
        <StatCard
          label="Needs Action"
          value={actionRequests.length}
          tone={actionRequests.length > 0 ? "rose" : "brand"}
          helper="Drafts, returns, and overdue items"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="panel-title">Needs Your Action</h3>
              <p className="mt-1 text-sm text-slate-400">
                Requests that need editing, resubmission, or closer follow-up.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-slate-300">
              {actionRequests.length} items
            </span>
          </div>

          <div className="mt-5">
            {myRequestsStatus === "loading" ? (
              <SkeletonBlock rows={3} />
            ) : actionRequests.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-white/12 bg-white/5 px-4 py-8 text-sm text-slate-400">
                Nothing needs your action right now. Submitted requests are moving through the workflow.
              </div>
            ) : (
              <div className="space-y-3">
                {actionRequests.slice(0, 4).map((request) => (
                  <Link
                    key={request.id}
                    to={`/requests/${request.id}`}
                    className="block rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4 transition hover:border-emerald-400/20 hover:bg-white/8"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <RequestStatusBadge
                            status={request.status}
                            isOverdue={request.isOverdue}
                          />
                          <RequestPriorityBadge priority={request.priority} />
                        </div>
                        <p className="mt-2 truncate text-sm font-semibold text-slate-50">
                          {request.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {getRequestNextStep(request)}
                        </p>
                      </div>
                      <div className="text-sm lg:text-right">
                        <p className="font-semibold text-slate-50">
                          {formatCurrency(request.estimatedCost)}
                        </p>
                        <p className="mt-1 text-slate-400">
                          {request.status === "DRAFT" ? "Continue draft" : "Open request"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="panel-title">Request Activity</h3>
              <p className="mt-1 text-sm text-slate-400">
                Requests created or submitted over the last 7 days.
              </p>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              7 days
            </span>
          </div>

          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="requestActivityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(148,163,184,0.12)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
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
                  formatter={(value) => [`${value}`, "Requests"]}
                  labelFormatter={(label, payload) => {
                    const point = payload?.[0]?.payload;
                    return point?.date ? formatDate(point.date) : label;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#requestActivityFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              ["Admin", progressCounts.admin],
              ["GM", progressCounts.gm],
              ["CEO", progressCounts.ceo],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-50">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="panel-title">Recent Requests</h3>
            <p className="mt-1 text-sm text-slate-400">
              Your latest drafts and submissions with current workflow position.
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link to="/requests">Open Full Queue</Link>
          </Button>
        </div>

        <div className="mt-5">
          {myRequestsStatus === "loading" ? (
            <SkeletonBlock rows={4} />
          ) : recentRequests.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-white/12 bg-white/5 px-4 py-8 text-sm text-slate-400">
              No requests yet. Create your first procurement request when you are ready.
            </div>
          ) : (
            <div className="table-shell">
              <div className="table-header-row hidden grid-cols-[minmax(0,1.5fr)_0.8fr_0.8fr_0.8fr_0.8fr] gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] lg:grid">
                <span>Request</span>
                <span>Status</span>
                <span>Stage</span>
                <span>Amount</span>
                <span>Updated</span>
              </div>

              <div className="divide-y divide-white/10">
                {recentRequests.map((request) => (
                  <Link
                    key={request.id}
                    to={`/requests/${request.id}`}
                    className="table-data-row block px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1.5fr)_0.8fr_0.8fr_0.8fr_0.8fr] lg:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-50">
                          {request.title}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <RequestPriorityBadge priority={request.priority} />
                          <span className="text-xs text-slate-400">
                            {request.departmentName || "No department"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <RequestStatusBadge
                          status={request.status}
                          isOverdue={request.isOverdue}
                        />
                      </div>

                      <div className="text-sm text-slate-300">
                        {formatWorkflowStage(request.currentStage)}
                      </div>

                      <div className="text-sm font-semibold text-slate-50">
                        {formatCurrency(request.estimatedCost)}
                      </div>

                      <div className="text-sm text-slate-400">
                        {request.submittedAt
                          ? formatDateTime(request.submittedAt)
                          : formatDateTime(request.createdAt)}
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

export default RequesterDashboardPage;
