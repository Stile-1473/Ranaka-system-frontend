import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  Eye,
  FileText,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import RequestPriorityBadge from "../../components/requests/RequestPriorityBadge";
import RequestStatusBadge from "../../components/requests/RequestStatusBadge";
import SkeletonBlock from "../../components/feedback/SkeletonBlock";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import { formatDate, formatDateTime } from "../../utils/dateFormatters";
import {
  formatCurrency,
  formatWorkflowStage,
} from "../../utils/requestHelpers";

const statusFilterMap = {
  all: () => true,
  drafts: (request) => request.status === "DRAFT",
  in_review: (request) =>
    !["DRAFT", "RETURNED_FOR_CORRECTION", "COMPLETED", "REJECTED"].includes(
      request.status
    ) && !request.isOverdue,
  returned: (request) => request.status === "RETURNED_FOR_CORRECTION",
  completed: (request) => request.status === "COMPLETED",
  overdue: (request) => request.isOverdue,
};

const priorityFilterMap = {
  all: () => true,
  critical: (request) => request.priority === "CRITICAL",
  high: (request) => request.priority === "HIGH",
  medium: (request) => request.priority === "MEDIUM",
  low: (request) => request.priority === "LOW",
};

const sortOptions = {
  newest: (left, right) =>
    new Date(right.updatedAt || right.createdAt) -
    new Date(left.updatedAt || left.createdAt),
  oldest: (left, right) =>
    new Date(left.updatedAt || left.createdAt) -
    new Date(right.updatedAt || right.createdAt),
  highest_cost: (left, right) =>
    Number(right.estimatedCost || 0) - Number(left.estimatedCost || 0),
  required_soon: (left, right) =>
    new Date(left.requiredByDate || left.createdAt) -
    new Date(right.requiredByDate || right.createdAt),
};

function MyRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");

  const myRequestsPage = useRequestQueryStore((state) => state.myRequestsPage);
  const myRequestsStatus = useRequestQueryStore((state) => state.myRequestsStatus);
  const myRequestsError = useRequestQueryStore((state) => state.myRequestsError);
  const fetchMyRequests = useRequestQueryStore((state) => state.fetchMyRequests);

  useEffect(() => {
    fetchMyRequests({
      page: 0,
      size: 50,
      sort: "createdAt",
      direction: "desc",
    });
  }, [fetchMyRequests]);

  const requests = myRequestsPage?.content ?? [];
  const filtersActive =
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    sortBy !== "newest" ||
    searchTerm.trim().length > 0;

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const statusMatcher = statusFilterMap[statusFilter] || statusFilterMap.all;
    const priorityMatcher =
      priorityFilterMap[priorityFilter] || priorityFilterMap.all;
    const sorter = sortOptions[sortBy] || sortOptions.newest;

    return requests
      .filter((request) => statusMatcher(request))
      .filter((request) => priorityMatcher(request))
      .filter((request) => {
        if (!normalizedSearch) return true;

        return [
          request.title,
          request.departmentName,
          request.priority,
          request.status,
          request.currentStage,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch)
          );
      })
      .slice()
      .sort(sorter);
  }, [priorityFilter, requests, searchTerm, sortBy, statusFilter]);

  const resetFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setSortBy("newest");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      <div className="page-action-bar">
        <div className="page-action-copy">
          <p className="section-title">Request Queue</p>
          <h2 className="page-action-title">Manage your procurement requests from one operational view.</h2>
          <p className="page-action-subtitle">
            Scan status, filter fast, and move directly into full request details when you need them.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link to="/requests/new">New Request</Link>
          </Button>
        </div>
      </div>

      {myRequestsStatus === "loading" ? (
        <SkeletonBlock rows={6} />
      ) : null}

      {myRequestsStatus === "error" ? (
        <Card>
          <div className="rounded-[1.25rem] border border-rose-400/20 bg-rose-500/10 px-4 py-10 text-sm text-rose-200">
            {myRequestsError || "We could not load your requests right now."}
          </div>
        </Card>
      ) : null}

      {myRequestsStatus !== "loading" &&
      myRequestsStatus !== "error" &&
      requests.length === 0 ? (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] border border-emerald-400/20 bg-emerald-500/12 text-emerald-300">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-50">No requests yet</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Start with a draft. You can submit it when the procurement details are ready.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <Button asChild>
                <Link to="/requests/new">Create your first request</Link>
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {requests.length > 0 && myRequestsStatus !== "loading" ? (
        <Card className="p-0">
          <div className="table-shell rounded-none border-0 bg-transparent shadow-none">
            <div className="border-b border-white/8 px-4 py-3 lg:px-6">
              <div className="flex flex-wrap items-center gap-3">
                <label className="relative block min-w-[16rem] flex-[1.6]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search requests..."
                    className="glass-control h-10 w-full rounded-full py-2 pl-11 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </label>

                <div className="relative min-w-[10.5rem] flex-1">
                  <select
                    aria-label="Filter by status"
                    className="glass-control h-10 w-full appearance-none rounded-full px-4 pr-10 text-sm text-slate-100 outline-none transition focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
                    style={{ colorScheme: "dark" }}
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option className="bg-slate-950 text-slate-100" value="all">All statuses</option>
                    <option className="bg-slate-950 text-slate-100" value="drafts">Drafts</option>
                    <option className="bg-slate-950 text-slate-100" value="in_review">In review</option>
                    <option className="bg-slate-950 text-slate-100" value="returned">Returned</option>
                    <option className="bg-slate-950 text-slate-100" value="completed">Completed</option>
                    <option className="bg-slate-950 text-slate-100" value="overdue">Overdue</option>
                  </select>
                  <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>

                <div className="relative min-w-[10.5rem] flex-1">
                  <select
                    aria-label="Filter by priority"
                    className="glass-control h-10 w-full appearance-none rounded-full px-4 pr-10 text-sm text-slate-100 outline-none transition focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
                    style={{ colorScheme: "dark" }}
                    value={priorityFilter}
                    onChange={(event) => setPriorityFilter(event.target.value)}
                  >
                    <option className="bg-slate-950 text-slate-100" value="all">All priorities</option>
                    <option className="bg-slate-950 text-slate-100" value="critical">Critical</option>
                    <option className="bg-slate-950 text-slate-100" value="high">High</option>
                    <option className="bg-slate-950 text-slate-100" value="medium">Medium</option>
                    <option className="bg-slate-950 text-slate-100" value="low">Low</option>
                  </select>
                  <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>

                <div className="relative min-w-[10.5rem] flex-1">
                  <select
                    aria-label="Sort requests"
                    className="glass-control h-10 w-full appearance-none rounded-full px-4 pr-10 text-sm text-slate-100 outline-none transition focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
                    style={{ colorScheme: "dark" }}
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                  >
                    <option className="bg-slate-950 text-slate-100" value="newest">Newest</option>
                    <option className="bg-slate-950 text-slate-100" value="oldest">Oldest</option>
                    <option className="bg-slate-950 text-slate-100" value="highest_cost">Highest cost</option>
                    <option className="bg-slate-950 text-slate-100" value="required_soon">Required soon</option>
                  </select>
                  <ArrowUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <span className="hidden rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-slate-400 2xl:inline-flex">
                    {filteredRequests.length} results
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

            {filteredRequests.length === 0 ? (
              <div className="px-6 py-10 text-sm text-slate-400">
                No requests match your current filters. Try a different search or filter combination.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="table-header-row sticky top-0 hidden min-w-[980px] grid-cols-[minmax(0,1.7fr)_0.9fr_0.8fr_0.9fr_0.8fr_0.95fr_0.8fr] gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] lg:grid">
                  <span>Request</span>
                  <span>Status</span>
                  <span>Priority</span>
                  <span>Stage</span>
                  <span>Amount</span>
                  <span>Updated</span>
                  <span className="text-right">Open</span>
                </div>

                <div className="divide-y divide-white/10">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className="table-data-row min-w-[980px] px-6 py-4"
                    >
                      <div className="grid grid-cols-[minmax(0,1.7fr)_0.9fr_0.8fr_0.9fr_0.8fr_0.95fr_0.8fr] gap-4 lg:items-center">
                        <div className="min-w-0">
                          <Link
                            to={`/requests/${request.id}`}
                            className="truncate text-sm font-semibold text-slate-50 transition hover:text-emerald-300"
                          >
                            {request.title}
                          </Link>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span>{request.departmentName || "No department"}</span>
                            <span className="text-slate-600">•</span>
                            <span>Required {formatDate(request.requiredByDate)}</span>
                          </div>
                        </div>

                        <div>
                          <RequestStatusBadge
                            status={request.status}
                            isOverdue={request.isOverdue}
                          />
                        </div>

                        <div>
                          <RequestPriorityBadge priority={request.priority} />
                        </div>

                        <div className="text-sm text-slate-300">
                          {formatWorkflowStage(request.currentStage)}
                        </div>

                        <div className="text-sm font-semibold text-slate-50">
                          {formatCurrency(request.estimatedCost)}
                        </div>

                        <div className="text-sm text-slate-400">
                          {formatDateTime(request.updatedAt || request.createdAt)}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button
                            asChild
                            variant="secondary"
                            className="h-9 w-9 px-0 py-0"
                          >
                            <Link
                              to={`/requests/${request.id}`}
                              aria-label={`View details for ${request.title}`}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

export default MyRequestsPage;
