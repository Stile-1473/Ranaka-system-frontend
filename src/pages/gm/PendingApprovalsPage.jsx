import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import RequestPriorityBadge from "../../components/requests/RequestPriorityBadge";
import RequestStatusBadge from "../../components/requests/RequestStatusBadge";
import SkeletonBlock from "../../components/feedback/SkeletonBlock";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import { formatDate, formatDateTime } from "../../utils/dateFormatters";
import { formatCurrency, formatWorkflowStage } from "../../utils/requestHelpers";

const priorityFilterMap = {
  all: () => true,
  critical: (request) => request.priority === "CRITICAL",
  high: (request) => request.priority === "HIGH",
  medium: (request) => request.priority === "MEDIUM",
  low: (request) => request.priority === "LOW",
};

const queueFilterMap = {
  all: () => true,
  overdue: (request) => request.isOverdue,
  returned: (request) => Number(request.returnCount || 0) > 0,
  critical: (request) => request.priority === "CRITICAL",
};

const sortOptions = {
  newest: (left, right) =>
    new Date(right.submittedAt || right.createdAt) -
    new Date(left.submittedAt || left.createdAt),
  oldest: (left, right) =>
    new Date(left.submittedAt || left.createdAt) -
    new Date(right.submittedAt || right.createdAt),
  required_soon: (left, right) =>
    new Date(left.requiredByDate || left.createdAt) -
    new Date(right.requiredByDate || right.createdAt),
  highest_cost: (left, right) =>
    Number(right.estimatedCost || 0) - Number(left.estimatedCost || 0),
};

function MetricTile({ label, value, tone = "default" }) {
  const toneClasses =
    tone === "danger"
      ? "border-rose-500/20 bg-rose-500/10"
      : tone === "warning"
        ? "border-amber-500/20 bg-amber-500/10"
        : "border-white/8 bg-white/[0.03]";

  return (
    <div className={`rounded-[1.25rem] border px-4 py-4 ${toneClasses}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}

function PendingApprovalsPage() {
  const location = useLocation();
  const isOverdueView = location.pathname === "/gm/overdue";
  const [searchTerm, setSearchTerm] = useState("");
  const [queueFilter, setQueueFilter] = useState(
    isOverdueView ? "overdue" : "all"
  );
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("required_soon");

  const pendingQueue = useRequestQueryStore((state) => state.pendingQueue);
  const pendingQueueStatus = useRequestQueryStore(
    (state) => state.pendingQueueStatus
  );
  const pendingQueueError = useRequestQueryStore(
    (state) => state.pendingQueueError
  );
  const fetchPendingQueue = useRequestQueryStore(
    (state) => state.fetchPendingQueue
  );

  useEffect(() => {
    fetchPendingQueue("GM");
  }, [fetchPendingQueue]);

  useEffect(() => {
    setQueueFilter(isOverdueView ? "overdue" : "all");
  }, [isOverdueView]);

  const queue = Array.isArray(pendingQueue) ? pendingQueue : [];
  const filteredQueue = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const queueMatcher = queueFilterMap[queueFilter] || queueFilterMap.all;
    const priorityMatcher =
      priorityFilterMap[priorityFilter] || priorityFilterMap.all;
    const sorter = sortOptions[sortBy] || sortOptions.required_soon;

    return queue
      .filter((request) => queueMatcher(request))
      .filter((request) => priorityMatcher(request))
      .filter((request) => {
        if (!normalizedSearch) {
          return true;
        }

        return [
          request.title,
          request.requesterName,
          request.departmentName,
          request.priority,
          request.status,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch)
          );
      })
      .slice()
      .sort(sorter);
  }, [priorityFilter, queue, queueFilter, searchTerm, sortBy]);

  const filtersActive =
    queueFilter !== (isOverdueView ? "overdue" : "all") ||
    priorityFilter !== "all" ||
    sortBy !== "required_soon" ||
    searchTerm.trim().length > 0;

  const stats = useMemo(
    () => ({
      waiting: queue.length,
      critical: queue.filter((request) => request.priority === "CRITICAL").length,
      overdue: queue.filter((request) => request.isOverdue).length,
      totalValue: formatCurrency(
        queue.reduce((sum, request) => sum + Number(request.estimatedCost || 0), 0)
      ),
    }),
    [queue]
  );

  const resetFilters = () => {
    setQueueFilter(isOverdueView ? "overdue" : "all");
    setPriorityFilter("all");
    setSortBy("required_soon");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      <div className="page-action-bar">
        <div className="page-action-copy">
          <p className="section-title">GM Queue</p>
          <h2 className="page-action-title">
            {isOverdueView ? "Overdue GM Approvals" : "Pending GM Approvals"}
          </h2>
          <p className="page-action-subtitle">
            Focus on management approvals that are urgent, high impact, or ready to move toward executive authorization.
          </p>
        </div>

        {isOverdueView ? (
          <Button asChild variant="secondary" className="rounded-2xl">
            <Link to="/gm/approvals">Back to Queue</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Waiting" value={stats.waiting} />
        <MetricTile label="Critical" value={stats.critical} tone="warning" />
        <MetricTile label="Overdue" value={stats.overdue} tone="danger" />
        <MetricTile label="Queue Value" value={stats.totalValue} />
      </div>

      {pendingQueueStatus === "loading" ? (
        <SkeletonBlock rows={6} />
      ) : pendingQueueError ? (
        <Card>
          <div className="rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 px-4 py-10 text-sm text-rose-200">
            {pendingQueueError}
          </div>
        </Card>
      ) : (
        <Card className="p-0">
          <div className="table-shell rounded-none border-0 bg-transparent shadow-none">
            <div className="border-b border-white/8 px-4 py-3 lg:px-6">
              <div className="flex flex-wrap items-center gap-3">
                <label className="relative block min-w-[16rem] flex-[1.7]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search requests, requesters, or departments..."
                    className="glass-control h-10 w-full rounded-full py-2 pl-11 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </label>

                <div className="relative min-w-[11rem] flex-1">
                  <select
                    aria-label="Filter queue"
                    className="glass-control h-10 w-full appearance-none rounded-full px-4 pr-10 text-sm text-slate-100 outline-none transition focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
                    style={{ colorScheme: "dark" }}
                    value={queueFilter}
                    onChange={(event) => setQueueFilter(event.target.value)}
                  >
                    {!isOverdueView ? (
                      <option className="bg-slate-950 text-slate-100" value="all">
                        All queue items
                      </option>
                    ) : null}
                    <option className="bg-slate-950 text-slate-100" value="critical">
                      Critical only
                    </option>
                    <option className="bg-slate-950 text-slate-100" value="overdue">
                      Overdue only
                    </option>
                    {!isOverdueView ? (
                      <option className="bg-slate-950 text-slate-100" value="returned">
                        Returned items
                      </option>
                    ) : null}
                  </select>
                  <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>

                <div className="relative min-w-[11rem] flex-1">
                  <select
                    aria-label="Filter priority"
                    className="glass-control h-10 w-full appearance-none rounded-full px-4 pr-10 text-sm text-slate-100 outline-none transition focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
                    style={{ colorScheme: "dark" }}
                    value={priorityFilter}
                    onChange={(event) => setPriorityFilter(event.target.value)}
                  >
                    <option className="bg-slate-950 text-slate-100" value="all">
                      All priorities
                    </option>
                    <option className="bg-slate-950 text-slate-100" value="critical">
                      Critical
                    </option>
                    <option className="bg-slate-950 text-slate-100" value="high">
                      High
                    </option>
                    <option className="bg-slate-950 text-slate-100" value="medium">
                      Medium
                    </option>
                    <option className="bg-slate-950 text-slate-100" value="low">
                      Low
                    </option>
                  </select>
                  <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>

                <div className="relative min-w-[11rem] flex-1">
                  <select
                    aria-label="Sort queue"
                    className="glass-control h-10 w-full appearance-none rounded-full px-4 pr-10 text-sm text-slate-100 outline-none transition focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
                    style={{ colorScheme: "dark" }}
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                  >
                    <option className="bg-slate-950 text-slate-100" value="required_soon">
                      Required soon
                    </option>
                    <option className="bg-slate-950 text-slate-100" value="newest">
                      Newest submitted
                    </option>
                    <option className="bg-slate-950 text-slate-100" value="oldest">
                      Oldest submitted
                    </option>
                    <option className="bg-slate-950 text-slate-100" value="highest_cost">
                      Highest cost
                    </option>
                  </select>
                  <ArrowUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <span className="hidden rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-slate-400 2xl:inline-flex">
                    {filteredQueue.length} results
                  </span>
                  {filtersActive ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="h-10 rounded-full border border-white/10 bg-white/6 px-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-slate-50"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {filteredQueue.length === 0 ? (
              <div className="px-6 py-12">
                <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300">
                    <Search className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-slate-100">
                    No queue items found
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    There are no management approvals matching the current search and filter.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/8">
                <div className="table-header-row sticky top-0 hidden grid-cols-[minmax(0,1.7fr)_1fr_0.8fr_0.9fr_0.9fr_0.95fr_0.85fr] gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] lg:grid">
                  <span>Request</span>
                  <span>Requester</span>
                  <span>Priority</span>
                  <span>Required By</span>
                  <span>Amount</span>
                  <span>Stage</span>
                  <span className="text-right">Review</span>
                </div>

                {filteredQueue.map((request) => (
                  <div
                    key={request.id}
                    className={`table-data-row px-4 py-4 transition lg:px-6 ${
                      request.isOverdue ? "bg-rose-500/[0.04]" : ""
                    }`}
                  >
                    <div className="space-y-4 lg:hidden">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-50">
                          {request.title}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <RequestStatusBadge
                            status={request.status}
                            isOverdue={request.isOverdue}
                          />
                          <RequestPriorityBadge priority={request.priority} />
                          {request.isOverdue ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-200">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Overdue
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Requester
                          </p>
                          <p className="mt-1 text-slate-200">
                            {request.requesterName || "Requester"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Department
                          </p>
                          <p className="mt-1 text-slate-200">
                            {request.departmentName || "No department"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Required By
                          </p>
                          <p className="mt-1 text-slate-200">
                            {formatDate(request.requiredByDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Amount
                          </p>
                          <p className="mt-1 font-semibold text-slate-50">
                            {formatCurrency(request.estimatedCost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Stage
                          </p>
                          <p className="mt-1 text-slate-200">
                            {formatWorkflowStage(request.currentStage)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Submitted
                          </p>
                          <p className="mt-1 text-slate-200">
                            {formatDateTime(request.submittedAt || request.createdAt)}
                          </p>
                        </div>
                      </div>

                      <Button
                        asChild
                        variant="secondary"
                        className="w-full justify-center gap-2 rounded-2xl"
                      >
                        <Link to={`/gm/approvals/${request.id}`}>
                          <span>Review</span>
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>

                    <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.7fr)_1fr_0.8fr_0.9fr_0.9fr_0.95fr_0.85fr] lg:gap-4 lg:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-50">
                          {request.title}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <RequestStatusBadge
                            status={request.status}
                            isOverdue={request.isOverdue}
                          />
                          <span className="text-xs text-slate-400">
                            {request.departmentName || "No department"}
                          </span>
                          {request.isOverdue ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-200">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Overdue
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-sm text-slate-300">
                        <div>{request.requesterName || "Requester"}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {formatDateTime(request.submittedAt || request.createdAt)}
                        </div>
                      </div>

                      <div>
                        <RequestPriorityBadge priority={request.priority} />
                      </div>

                      <div className="text-sm text-slate-300">
                        {formatDate(request.requiredByDate)}
                      </div>

                      <div className="text-sm font-semibold text-slate-50">
                        {formatCurrency(request.estimatedCost)}
                      </div>

                      <div className="text-sm text-slate-300">
                        {formatWorkflowStage(request.currentStage)}
                      </div>

                      <div className="flex justify-end">
                        <Button
                          asChild
                          variant="secondary"
                          className="gap-2 rounded-2xl px-3 py-2"
                        >
                          <Link to={`/gm/approvals/${request.id}`}>
                            <span>Review</span>
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default PendingApprovalsPage;
