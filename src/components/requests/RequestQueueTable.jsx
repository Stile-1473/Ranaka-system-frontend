import { Link } from "react-router-dom";
import RequestPriorityBadge from "./RequestPriorityBadge";
import RequestStatusBadge from "./RequestStatusBadge";
import { formatDate, formatDateTime } from "../../utils/dateFormatters";
import { formatCurrency, formatWorkflowStage } from "../../utils/requestHelpers";

function RequestQueueTable({ requests, toRequestPath, actionLabel = "Review" }) {
  return (
    <div className="table-shell">
      <div className="table-header-row sticky top-0 hidden grid-cols-[minmax(0,1.6fr)_0.9fr_0.9fr_0.9fr_0.7fr] gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur-xl lg:grid">
        <span>Request</span>
        <span>Requester</span>
        <span>Due Date</span>
        <span>Amount</span>
        <span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-white/10">
        {requests.map((request) => (
          <Link
            key={request.id}
            to={toRequestPath(request)}
            className="table-data-row block px-4 py-4"
          >
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.6fr)_0.9fr_0.9fr_0.9fr_0.7fr] lg:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-50">
                  {request.title}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <RequestStatusBadge
                    status={request.status}
                    isOverdue={request.isOverdue}
                  />
                  <RequestPriorityBadge priority={request.priority} />
                  <span className="text-xs text-slate-400">
                    {request.departmentName || "No department"}
                  </span>
                </div>
              </div>

              <div className="text-sm text-slate-300">
                {request.requesterName || "Requester"}
              </div>

              <div className="text-sm text-slate-300">
                <div>{formatDate(request.requiredByDate)}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {formatWorkflowStage(request.currentStage)}
                </div>
              </div>

              <div className="text-sm text-slate-100">
                <div className="font-semibold">
                  {formatCurrency(request.estimatedCost)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {request.submittedAt
                    ? formatDateTime(request.submittedAt)
                    : formatDateTime(request.createdAt)}
                </div>
              </div>

              <div className="text-sm font-semibold text-emerald-300 lg:text-right">
                {actionLabel}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default RequestQueueTable;
