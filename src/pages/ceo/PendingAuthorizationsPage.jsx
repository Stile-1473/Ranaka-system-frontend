import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import StatCard from "../../components/dashboard/StatCard";
import RequestPriorityBadge from "../../components/requests/RequestPriorityBadge";
import RequestStatusBadge from "../../components/requests/RequestStatusBadge";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import {
  formatCurrency,
  formatWorkflowStage,
} from "../../utils/requestHelpers";
import { formatDate, formatDateTime } from "../../utils/dateFormatters";

function PendingAuthorizationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
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
    fetchPendingQueue("CEO");
  }, [fetchPendingQueue]);

  const queue = Array.isArray(pendingQueue) ? pendingQueue : [];
  const filteredQueue = useMemo(() => {
    return queue.filter((request) => {
      if (activeFilter === "critical" && request.priority !== "CRITICAL") {
        return false;
      }

      if (activeFilter === "overdue" && !request.isOverdue) {
        return false;
      }

      if (activeFilter === "highValue" && Number(request.estimatedCost || 0) <= 10000) {
        return false;
      }

      if (!searchTerm.trim()) {
        return true;
      }

      const normalized = searchTerm.trim().toLowerCase();
      return (
        request.title?.toLowerCase().includes(normalized) ||
        request.requesterName?.toLowerCase().includes(normalized) ||
        request.departmentName?.toLowerCase().includes(normalized)
      );
    });
  }, [activeFilter, queue, searchTerm]);

  const stats = useMemo(
    () => ({
      waiting: queue.length,
      highValue: queue.filter((request) => Number(request.estimatedCost || 0) > 10000)
        .length,
      overdue: queue.filter((request) => request.isOverdue).length,
      critical: queue.filter((request) => request.priority === "CRITICAL").length,
    }),
    [queue]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Pending Authorizations
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review final-stage requests and decide whether they should be authorized.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Waiting" value={stats.waiting} />
        <StatCard label="High Value" value={stats.highValue} tone="amber" />
        <StatCard label="Overdue" value={stats.overdue} tone="rose" />
        <StatCard label="Critical" value={stats.critical} />
      </div>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title, requester, or department"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 lg:max-w-md"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={activeFilter === "all" ? "primary" : "secondary"}
              className="px-3 py-2"
              onClick={() => setActiveFilter("all")}
            >
              All
            </Button>
            <Button
              variant={activeFilter === "highValue" ? "primary" : "secondary"}
              className="px-3 py-2"
              onClick={() => setActiveFilter("highValue")}
            >
              High Value
            </Button>
            <Button
              variant={activeFilter === "critical" ? "primary" : "secondary"}
              className="px-3 py-2"
              onClick={() => setActiveFilter("critical")}
            >
              Critical
            </Button>
            <Button
              variant={activeFilter === "overdue" ? "primary" : "secondary"}
              className="px-3 py-2"
              onClick={() => setActiveFilter("overdue")}
            >
              Overdue
            </Button>
          </div>
        </div>
      </Card>

      {pendingQueueStatus === "loading" ? (
        <Card>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-sm text-slate-500">
            Loading CEO queue...
          </div>
        </Card>
      ) : pendingQueueError ? (
        <Card>
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-10 text-sm text-rose-700">
            {pendingQueueError}
          </div>
        </Card>
      ) : filteredQueue.length === 0 ? (
        <Card>
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-500">
            No requests match the current CEO filters.
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="divide-y divide-slate-200">
            {filteredQueue.map((request) => (
              <Link
                key={request.id}
                to={`/ceo/authorizations/${request.id}`}
                className="block px-5 py-4 transition hover:bg-slate-50"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>{request.requesterName}</span>
                      <span>{request.departmentName}</span>
                      <span>{formatWorkflowStage(request.currentStage)}</span>
                      <span>Required {formatDate(request.requiredByDate)}</span>
                    </div>
                  </div>
                  <div className="text-sm lg:text-right">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(request.estimatedCost)}
                    </p>
                    <p className="mt-1 text-slate-500">
                      {request.submittedAt
                        ? `Submitted ${formatDateTime(request.submittedAt)}`
                        : `Created ${formatDateTime(request.createdAt)}`}
                    </p>
                    <p className="mt-2 text-sm font-medium text-brand-700">
                      Review authorization
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default PendingAuthorizationsPage;
