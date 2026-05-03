import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import RequestPriorityBadge from "../../components/requests/RequestPriorityBadge";
import RequestStatusBadge from "../../components/requests/RequestStatusBadge";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import { formatDate, formatDateTime } from "../../utils/dateFormatters";
import { formatCurrency } from "../../utils/requestHelpers";

const requestMatchesFilter = (request, filter) => {
  if (filter === "all") return true;
  if (filter === "draft") return request.status === "DRAFT";
  if (filter === "returned") return request.status === "RETURNED_FOR_CORRECTION";
  if (filter === "completed") return request.status === "COMPLETED";
  if (filter === "overdue") return request.isOverdue;

  return (
    request.status !== "DRAFT" &&
    request.status !== "RETURNED_FOR_CORRECTION" &&
    request.status !== "COMPLETED" &&
    !request.isOverdue
  );
};

function QueueMetricCard({ label, value, tone = "slate" }) {
  const toneClasses =
    tone === "brand"
      ? "bg-brand-50 text-brand-700 border-brand-100"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700 border-amber-100"
        : tone === "rose"
          ? "bg-rose-50 text-rose-700 border-rose-100"
          : "bg-white text-slate-700 border-slate-200";

  return (
    <div className={`rounded-xl border px-4 py-4 ${toneClasses}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MyRequestsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRequests, setExpandedRequests] = useState([]);
  const myRequestsPage = useRequestQueryStore((state) => state.myRequestsPage);
  const myRequestsStatus = useRequestQueryStore((state) => state.myRequestsStatus);
  const myRequestsError = useRequestQueryStore((state) => state.myRequestsError);
  const fetchMyRequests = useRequestQueryStore((state) => state.fetchMyRequests);

  useEffect(() => {
    fetchMyRequests({
      page: 0,
      size: 10,
      sort: "createdAt",
      direction: "desc",
    });
  }, [fetchMyRequests]);

  const requests = myRequestsPage?.content ?? [];
  const metrics = useMemo(() => {
    const draftCount = requests.filter((request) => request.status === "DRAFT").length;
    const returnedCount = requests.filter(
      (request) => request.status === "RETURNED_FOR_CORRECTION"
    ).length;
    const completedCount = requests.filter(
      (request) => request.status === "COMPLETED"
    ).length;
    const inReviewCount = requests.filter(
      (request) =>
        request.status !== "DRAFT" &&
        request.status !== "RETURNED_FOR_CORRECTION" &&
        request.status !== "COMPLETED" &&
        !request.isOverdue
    ).length;

    return {
      total: requests.length,
      draftCount,
      returnedCount,
      completedCount,
      inReviewCount,
      overdueCount: requests.filter((request) => request.isOverdue).length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesFilter = requestMatchesFilter(request, activeFilter);
      const matchesSearch =
        !normalizedSearch ||
        request.title?.toLowerCase().includes(normalizedSearch) ||
        request.departmentName?.toLowerCase().includes(normalizedSearch) ||
        request.priority?.toLowerCase().includes(normalizedSearch) ||
        request.status?.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, requests, searchTerm]);

  const filterOptions = [
    { id: "all", label: "All", count: metrics.total },
    { id: "draft", label: "Drafts", count: metrics.draftCount },
    { id: "in-review", label: "In Review", count: metrics.inReviewCount },
    { id: "returned", label: "Returned", count: metrics.returnedCount },
    { id: "completed", label: "Completed", count: metrics.completedCount },
    { id: "overdue", label: "Overdue", count: metrics.overdueCount },
  ];

  const toggleRequestExpanded = (requestId) => {
    setExpandedRequests((current) =>
      current.includes(requestId)
        ? current.filter((id) => id !== requestId)
        : [...current, requestId]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-title">My Requests</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Your request queue
            </h2>
          </div>
          <Button asChild className="gap-2">
            <Link to="/requests/new">Create Request</Link>
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QueueMetricCard label="Total" value={metrics.total} />
        <QueueMetricCard label="Drafts" value={metrics.draftCount} tone="brand" />
        <QueueMetricCard
          label="Returned"
          value={metrics.returnedCount}
          tone="amber"
        />
        <QueueMetricCard
          label="Completed"
          value={metrics.completedCount}
          tone="slate"
        />
      </div>

      {myRequestsStatus === "loading" ? (
        <Card>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-sm text-slate-500">
            Loading your requests...
          </div>
        </Card>
      ) : null}

      {myRequestsStatus === "error" ? (
        <Card>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-10 text-sm text-rose-700">
            {myRequestsError || "We could not load your requests right now."}
          </div>
        </Card>
      ) : null}

      {myRequestsStatus !== "loading" &&
      myRequestsStatus !== "error" &&
      requests.length === 0 ? (
        <Card>
          <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10">
            <div>
              <p className="text-lg font-semibold text-slate-900">
                No requests yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Start with a draft, then submit it into the Admin to GM to CEO
                workflow when all required details are ready.
              </p>
            </div>
            <Button asChild>
              <Link to="/requests/new">Create your first request</Link>
            </Button>
          </div>
        </Card>
      ) : null}

      {requests.length > 0 ? (
        <>
          <Card>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setActiveFilter(option.id)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      activeFilter === option.id
                        ? "border-brand-200 bg-brand-50 text-brand-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-brand-100 hover:text-slate-900"
                    }`}
                  >
                    <span>{option.label}</span>
                    <span className="rounded-md bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      {option.count}
                    </span>
                  </button>
                ))}
              </div>

              <label className="relative block w-full xl:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search title, department, status..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                />
              </label>
            </div>
          </Card>

          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      No matching requests
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try a different search or filter.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card
                  key={request.id}
                  className="border border-transparent transition hover:border-brand-100 hover:shadow-[0_20px_60px_-35px_rgba(35,139,100,0.25)]"
                >
                  {(() => {
                    const isExpanded = expandedRequests.includes(request.id);

                    return (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <RequestStatusBadge
                                status={request.status}
                                isOverdue={request.isOverdue}
                              />
                              <RequestPriorityBadge priority={request.priority} />
                              {request.returnCount ? (
                                <span className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                  Returned {request.returnCount}x
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-4">
                        <Link
                          to={`/requests/${request.id}`}
                          className="text-lg font-semibold text-slate-900 transition hover:text-brand-700"
                        >
                          {request.title}
                              </Link>
                              <p className="mt-1 text-sm text-slate-500">
                                {request.departmentName || "No department assigned"}
                              </p>
                            </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {formatCurrency(request.estimatedCost)}
                        </span>
                              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                Required {formatDate(request.requiredByDate)}
                              </span>
                              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {request.submittedAt
                                  ? `Submitted ${formatDateTime(request.submittedAt)}`
                                  : "Draft not submitted"}
                              </span>
                            </div>
                          </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <Button
                          type="button"
                          variant="secondary"
                          className="gap-2"
                              onClick={() => toggleRequestExpanded(request.id)}
                            >
                              <span>{isExpanded ? "Collapse" : "Expand"}</span>
                              <ChevronDown
                                className={`h-4 w-4 transition ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </Button>
                        <Button asChild variant="secondary" className="gap-2">
                          <Link to={`/requests/${request.id}`}>Open Request</Link>
                        </Button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Cost
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-900">
                                {formatCurrency(request.estimatedCost)}
                              </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Required By
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-900">
                                {formatDate(request.requiredByDate)}
                              </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Created
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-900">
                                {formatDateTime(request.createdAt)}
                              </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Workflow
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-900">
                                {request.submittedAt
                                  ? `Submitted ${formatDateTime(request.submittedAt)}`
                                  : "Draft not submitted"}
                              </p>
                            </div>

                            <div className="sm:col-span-2 xl:col-span-4 flex flex-wrap items-center gap-3 pt-1">
                              {request.status === "DRAFT" ? (
                                <Button asChild variant="secondary" className="gap-2">
                                  <Link to={`/requests/${request.id}`}>Continue Draft</Link>
                                </Button>
                              ) : null}
                              {request.status === "RETURNED_FOR_CORRECTION" ? (
                                <Button asChild variant="secondary" className="gap-2">
                                  <Link to={`/requests/${request.id}`}>Edit Returned Request</Link>
                                </Button>
                              ) : null}
                              <Button asChild variant="secondary" className="gap-2">
                                <Link to={`/requests/${request.id}`}>View Full Details</Link>
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}
                </Card>
              ))
            )}
          </div>
          <Card>
            <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing {filteredRequests.length} of {myRequestsPage.totalElements}{" "}
                requests
              </p>
              <p>
                Page {(myRequestsPage.number ?? 0) + 1} of{" "}
                {myRequestsPage.totalPages || 1}
              </p>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

export default MyRequestsPage;
