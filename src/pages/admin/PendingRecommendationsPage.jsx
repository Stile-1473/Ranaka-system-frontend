import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import StatCard from "../../components/dashboard/StatCard";
import RequestPriorityBadge from "../../components/requests/RequestPriorityBadge";
import RequestStatusBadge from "../../components/requests/RequestStatusBadge";
import EmptyState from "../../components/feedback/EmptyState";
import SkeletonBlock from "../../components/feedback/SkeletonBlock";
import RequestQueueTable from "../../components/requests/RequestQueueTable";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import {
  formatCurrency,
  formatWorkflowStage,
} from "../../utils/requestHelpers";
import { formatDate, formatDateTime } from "../../utils/dateFormatters";

function PendingRecommendationsPage() {
  const location = useLocation();
  const isOverdueView = location.pathname === "/admin/overdue";
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState(isOverdueView ? "overdue" : "all");
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
    fetchPendingQueue("ADMIN");
  }, [fetchPendingQueue]);

  useEffect(() => {
    setActiveFilter(isOverdueView ? "overdue" : "all");
  }, [isOverdueView]);

  const queue = Array.isArray(pendingQueue) ? pendingQueue : [];
  const filteredQueue = useMemo(() => {
    return queue.filter((request) => {
      if (activeFilter === "critical" && request.priority !== "CRITICAL") {
        return false;
      }

      if (activeFilter === "overdue" && !request.isOverdue) {
        return false;
      }

      if (activeFilter === "returned" && Number(request.returnCount || 0) === 0) {
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
      critical: queue.filter((request) => request.priority === "CRITICAL").length,
      overdue: queue.filter((request) => request.isOverdue).length,
      returned: queue.filter((request) => Number(request.returnCount || 0) > 0)
        .length,
    }),
    [queue]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {isOverdueView ? "Overdue Recommendations" : "Pending Recommendations"}
          </h2>
        </div>
        {isOverdueView ? (
          <Button asChild variant="secondary">
            <Link to="/admin/recommendations">Back to Queue</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Waiting" value={stats.waiting} />
        <StatCard label="Critical" value={stats.critical} tone="amber" />
        <StatCard label="Overdue" value={stats.overdue} tone="rose" />
        <StatCard label="Returned" value={stats.returned} />
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search requests..."
            className="glass-control flex-1 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100/80"
          />
          <div className="flex flex-wrap items-center gap-2">
            {!isOverdueView && (
              <Button
                variant={activeFilter === "all" ? "primary" : "secondary"}
                className="px-3 py-2 text-sm"
                onClick={() => setActiveFilter("all")}
              >
                All
              </Button>
            )}
            <Button
              variant={activeFilter === "critical" ? "primary" : "secondary"}
              className="px-3 py-2 text-sm"
              onClick={() => setActiveFilter("critical")}
            >
              Critical
            </Button>
            <Button
              variant={activeFilter === "overdue" ? "primary" : "secondary"}
              className="px-3 py-2 text-sm"
              onClick={() => setActiveFilter("overdue")}
            >
              Overdue
            </Button>
            {!isOverdueView && (
              <Button
                variant={activeFilter === "returned" ? "primary" : "secondary"}
                className="px-3 py-2 text-sm"
                onClick={() => setActiveFilter("returned")}
              >
                Returned
              </Button>
            )}
          </div>
        </div>
      </Card>

      {pendingQueueStatus === "loading" ? (
        <SkeletonBlock rows={5} />
      ) : pendingQueueError ? (
        <Card>
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-10 text-sm text-rose-700">
            {pendingQueueError}
          </div>
        </Card>
      ) : filteredQueue.length === 0 ? (
        <EmptyState
          icon={activeFilter === "all" ? ClipboardCheck : Search}
          title="No requests found"
          description="There are no queue items matching the current search and filter."
        />
      ) : (
        <RequestQueueTable
          requests={filteredQueue}
          toRequestPath={(request) => `/admin/recommendations/${request.id}`}
          actionLabel="Recommend"
        />
      )}
    </div>
  );
}

export default PendingRecommendationsPage;
