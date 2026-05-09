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
import Modal from "../../components/ui/Modal";
import SelectField from "../../components/forms/SelectField";
import RequestPriorityBadge from "../../components/requests/RequestPriorityBadge";
import RequestStatusBadge from "../../components/requests/RequestStatusBadge";
import SkeletonBlock from "../../components/feedback/SkeletonBlock";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import { formatDate, formatDateTime } from "../../utils/dateFormatters";
import {
  formatApprovalAction,
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

function MetricChip({ label, value, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium transition ${
        isActive
          ? "border-emerald-400/30 bg-emerald-500/14 text-emerald-300 shadow-[0_0_22px_rgba(34,197,94,0.18)]"
          : "border-white/10 bg-white/6 text-slate-300 hover:bg-white/10 hover:text-slate-50"
      }`}
    >
      <span>{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
          isActive ? "bg-emerald-500/18 text-emerald-200" : "bg-white/8 text-slate-400"
        }`}
      >
        {value}
      </span>
    </button>
  );
}

function QuickViewMeta({ label, value }) {
  return (
    <div className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-50">{value}</p>
    </div>
  );
}

function MyRequestsPage() {
  const [activeSummary, setActiveSummary] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [quickViewId, setQuickViewId] = useState(null);

  const myRequestsPage = useRequestQueryStore((state) => state.myRequestsPage);
  const myRequestsStatus = useRequestQueryStore((state) => state.myRequestsStatus);
  const myRequestsError = useRequestQueryStore((state) => state.myRequestsError);
  const fetchMyRequests = useRequestQueryStore((state) => state.fetchMyRequests);
  const requestDetails = useRequestQueryStore((state) => state.requestDetails);
  const requestDetailsStatus = useRequestQueryStore(
    (state) => state.requestDetailsStatus
  );
  const fetchRequestDetails = useRequestQueryStore(
    (state) => state.fetchRequestDetails
  );

  useEffect(() => {
    fetchMyRequests({
      page: 0,
      size: 50,
      sort: "createdAt",
      direction: "desc",
    });
  }, [fetchMyRequests]);

  useEffect(() => {
    if (quickViewId) {
      fetchRequestDetails(quickViewId);
    }
  }, [fetchRequestDetails, quickViewId]);

  const requests = myRequestsPage?.content ?? [];

  const metrics = useMemo(
    () => ({
      all: requests.length,
      drafts: requests.filter((request) => request.status === "DRAFT").length,
      in_review: requests.filter((request) =>
        statusFilterMap.in_review(request)
      ).length,
      returned: requests.filter(
        (request) => request.status === "RETURNED_FOR_CORRECTION"
      ).length,
      completed: requests.filter((request) => request.status === "COMPLETED")
        .length,
      overdue: requests.filter((request) => request.isOverdue).length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const statusMatcher = statusFilterMap[statusFilter] || statusFilterMap.all;
    const priorityMatcher =
      priorityFilterMap[priorityFilter] || priorityFilterMap.all;
    const summaryMatcher = statusFilterMap[activeSummary] || statusFilterMap.all;
    const sorter = sortOptions[sortBy] || sortOptions.newest;

    return requests
      .filter((request) => summaryMatcher(request))
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
  }, [activeSummary, priorityFilter, requests, searchTerm, sortBy, statusFilter]);

  const quickViewRequest =
    requestDetails && String(requestDetails.id) === String(quickViewId)
      ? requestDetails
      : null;

  const openQuickView = (requestId) => setQuickViewId(requestId);
  const closeQuickView = () => setQuickViewId(null);

  return (
    <div className="space-y-6">
      <div className="page-action-bar">
        <div className="page-action-copy">
          <p className="section-title">Request Queue</p>
          <h2 className="page-action-title">Manage your procurement requests from one operational view.</h2>
          <p className="page-action-subtitle">
            Scan status, filter fast, open a quick view, and move into full details only when you need deeper context.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link to="/requests/new">New Request</Link>
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <MetricChip
              label="All"
              value={metrics.all}
              isActive={activeSummary === "all"}
              onClick={() => setActiveSummary("all")}
            />
            <MetricChip
              label="Drafts"
              value={metrics.drafts}
              isActive={activeSummary === "drafts"}
              onClick={() => setActiveSummary("drafts")}
            />
            <MetricChip
              label="In Review"
              value={metrics.in_review}
              isActive={activeSummary === "in_review"}
              onClick={() => setActiveSummary("in_review")}
            />
            <MetricChip
              label="Returned"
              value={metrics.returned}
              isActive={activeSummary === "returned"}
              onClick={() => setActiveSummary("returned")}
            />
            <MetricChip
              label="Completed"
              value={metrics.completed}
              isActive={activeSummary === "completed"}
              onClick={() => setActiveSummary("completed")}
            />
            <MetricChip
              label="Overdue"
              value={metrics.overdue}
              isActive={activeSummary === "overdue"}
              onClick={() => setActiveSummary("overdue")}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_0.85fr_0.85fr_0.85fr]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by title, department, status, or stage..."
                className="glass-control h-11 w-full rounded-full py-2 pl-11 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            <SelectField
              label="Status"
              className="gap-1"
              selectClassName="h-11 rounded-full"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="drafts">Drafts</option>
              <option value="in_review">In review</option>
              <option value="returned">Returned</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </SelectField>

            <SelectField
              label="Priority"
              className="gap-1"
              selectClassName="h-11 rounded-full"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <option value="all">All priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </SelectField>

            <SelectField
              label="Sort"
              className="gap-1"
              selectClassName="h-11 rounded-full"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest_cost">Highest cost</option>
              <option value="required_soon">Required soon</option>
            </SelectField>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {filteredRequests.length} matching requests
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sorted by {sortBy.replace("_", " ")}
            </span>
          </div>
        </div>
      </Card>

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
          {filteredRequests.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-400">
              No requests match your current filters. Try a different search or filter combination.
            </div>
          ) : (
            <div className="table-shell rounded-none border-0 bg-transparent shadow-none">
              <div className="overflow-x-auto">
                <div className="table-header-row sticky top-0 hidden min-w-[980px] grid-cols-[minmax(0,1.7fr)_0.9fr_0.8fr_0.9fr_0.8fr_0.95fr_0.8fr] gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] lg:grid">
                  <span>Request</span>
                  <span>Status</span>
                  <span>Priority</span>
                  <span>Stage</span>
                  <span>Amount</span>
                  <span>Updated</span>
                  <span className="text-right">Actions</span>
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
                            type="button"
                            variant="secondary"
                            className="h-9 px-3 py-0"
                            onClick={() => openQuickView(request.id)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="ml-2">Quick View</span>
                          </Button>
                          <Button asChild variant="ghost" className="h-9 px-3 py-0">
                            <Link to={`/requests/${request.id}`}>Open</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      ) : null}

      <Modal
        open={Boolean(quickViewId)}
        onClose={closeQuickView}
        title={quickViewRequest?.title || "Quick View"}
        description="Review the request quickly, then open full details if you need the complete case file."
        className="max-w-4xl"
      >
        {requestDetailsStatus === "loading" || !quickViewRequest ? (
          <SkeletonBlock rows={5} />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <RequestStatusBadge
                status={quickViewRequest.status}
                isOverdue={quickViewRequest.isOverdue}
              />
              <RequestPriorityBadge priority={quickViewRequest.priority} />
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-slate-300">
                {formatWorkflowStage(quickViewRequest.currentStage)}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <QuickViewMeta
                label="Department"
                value={quickViewRequest.departmentName || "No department"}
              />
              <QuickViewMeta
                label="Amount"
                value={formatCurrency(quickViewRequest.estimatedCost)}
              />
              <QuickViewMeta
                label="Required By"
                value={formatDate(quickViewRequest.requiredByDate)}
              />
              <QuickViewMeta
                label="Submitted"
                value={
                  quickViewRequest.submittedAt
                    ? formatDateTime(quickViewRequest.submittedAt)
                    : "Not submitted"
                }
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <div>
                  <h3 className="panel-title">Summary</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {quickViewRequest.description || "No description provided."}
                  </p>
                </div>

                <div>
                  <h3 className="panel-title">Justification</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {quickViewRequest.justification || "No justification provided."}
                  </p>
                </div>

                <div>
                  <h3 className="panel-title">Line Items</h3>
                  <div className="mt-4 space-y-3">
                    {(quickViewRequest.lineItems || []).slice(0, 4).map((item, index) => (
                      <div
                        key={item.id || `${item.itemDescription}-${index}`}
                        className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-50">
                              {item.itemDescription}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Qty {item.quantity || 0}
                              {item.unit ? ` • ${item.unit}` : ""}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-slate-50">
                            {formatCurrency(item.totalCost)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="panel-title">Recent Activity</h3>
                  <div className="mt-4 space-y-3">
                    {(quickViewRequest.approvalHistory || []).slice(0, 4).map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-4"
                      >
                        <p className="text-sm font-semibold text-slate-50">
                          {formatApprovalAction(entry.action)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {entry.approverName || "System"} • {formatDateTime(entry.actionDate || entry.createdAt)}
                        </p>
                        {entry.comment ? (
                          <p className="mt-2 text-sm text-slate-300">{entry.comment}</p>
                        ) : null}
                      </div>
                    ))}

                    {(!quickViewRequest.approvalHistory ||
                      quickViewRequest.approvalHistory.length === 0) && (
                      <div className="rounded-[1.1rem] border border-dashed border-white/12 bg-white/5 px-4 py-4 text-sm text-slate-400">
                        No approval history yet.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="panel-title">Comments</h3>
                  <div className="mt-4 space-y-3">
                    {(quickViewRequest.comments || []).slice(0, 3).map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-4"
                      >
                        <p className="text-sm font-semibold text-slate-50">
                          {comment.authorName || "Comment"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDateTime(comment.createdAt)}
                        </p>
                        <p className="mt-2 text-sm text-slate-300">{comment.comment}</p>
                      </div>
                    ))}

                    {(!quickViewRequest.comments || quickViewRequest.comments.length === 0) && (
                      <div className="rounded-[1.1rem] border border-dashed border-white/12 bg-white/5 px-4 py-4 text-sm text-slate-400">
                        No comments yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-5">
              {(quickViewRequest.status === "DRAFT" ||
                quickViewRequest.status === "RETURNED_FOR_CORRECTION") && (
                <Button asChild variant="secondary">
                  <Link to={`/requests/${quickViewRequest.id}/edit`} onClick={closeQuickView}>
                    {quickViewRequest.status === "DRAFT" ? "Continue Draft" : "Edit Request"}
                  </Link>
                </Button>
              )}
              <Button asChild>
                <Link to={`/requests/${quickViewRequest.id}`} onClick={closeQuickView}>
                  Open Full Details
                </Link>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default MyRequestsPage;
