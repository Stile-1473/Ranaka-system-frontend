import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  CheckCheck,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useNotificationMutationStore } from "../../stores/mutation/notificationMutationStore";
import { useNotificationQueryStore } from "../../stores/query/notificationQueryStore";
import { formatDateTime } from "../../utils/dateFormatters";
import {
  buildNotificationTarget,
  formatNotificationType,
  mapNotificationTypeToVariant,
} from "../../utils/notificationHelpers";

function NotificationsPage() {
  const currentUser = useCurrentUser();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const notificationsPage = useNotificationQueryStore(
    (state) => state.notificationsPage
  );
  const notificationsStatus = useNotificationQueryStore(
    (state) => state.notificationsStatus
  );
  const notificationsError = useNotificationQueryStore(
    (state) => state.notificationsError
  );
  const fetchNotifications = useNotificationQueryStore(
    (state) => state.fetchNotifications
  );
  const unreadCount = useNotificationQueryStore((state) => state.unreadCount);

  const markNotificationRead = useNotificationMutationStore(
    (state) => state.markNotificationRead
  );
  const markReadStatus = useNotificationMutationStore(
    (state) => state.markReadStatus
  );
  const markAllNotificationsRead = useNotificationMutationStore(
    (state) => state.markAllNotificationsRead
  );
  const markAllReadStatus = useNotificationMutationStore(
    (state) => state.markAllReadStatus
  );

  useEffect(() => {
    fetchNotifications({ page: 0, size: 30 });
  }, [fetchNotifications]);

  const notifications = notificationsPage?.content ?? [];
  const filteredNotifications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesFilter =
        activeFilter === "unread" ? !notification.read : true;

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        notification.title,
        notification.message,
        notification.type,
        notification.referenceType,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedSearch)
        );
    });
  }, [activeFilter, notifications, searchTerm]);

  const filtersActive =
    activeFilter !== "all" || searchTerm.trim().length > 0;

  const resetFilters = () => {
    setActiveFilter("all");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      <div className="page-action-bar">
        <div className="page-action-copy">
          <p className="section-title">Notifications</p>
          <h2 className="page-action-title">
            Track request updates from one shared inbox.
          </h2>
          <p className="page-action-subtitle">
            Workflow movements, reminders, and role-specific actions appear here as requests progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={unreadCount > 0 ? "warning" : "neutral"}>
            {unreadCount} unread
          </Badge>
          <Button
            variant="secondary"
            className="gap-2 rounded-2xl"
            disabled={unreadCount === 0 || markAllReadStatus === "loading"}
            onClick={() => markAllNotificationsRead()}
          >
            <CheckCheck className="h-4 w-4" />
            {markAllReadStatus === "loading" ? "Marking..." : "Mark All Read"}
          </Button>
        </div>
      </div>

      {notificationsStatus === "loading" ? (
        <Card>
          <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-10 text-sm text-slate-400">
            Loading notifications...
          </div>
        </Card>
      ) : notificationsError ? (
        <Card>
          <div className="rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 px-4 py-10 text-sm text-rose-200">
            {notificationsError}
          </div>
        </Card>
      ) : (
        <Card className="p-0">
          <div className="table-shell rounded-none border-0 bg-transparent shadow-none">
            <div className="border-b border-white/8 px-4 py-3 lg:px-6">
              <div className="flex flex-wrap items-center gap-3">
                <label className="relative block min-w-[16rem] flex-[1.6]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search notifications..."
                    className="glass-control h-10 w-full rounded-full py-2 pl-11 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={activeFilter === "all" ? "primary" : "secondary"}
                    className="rounded-2xl px-3 py-2"
                    onClick={() => setActiveFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    type="button"
                    variant={activeFilter === "unread" ? "primary" : "secondary"}
                    className="rounded-2xl px-3 py-2"
                    onClick={() => setActiveFilter("unread")}
                  >
                    Unread
                  </Button>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <span className="hidden rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-slate-400 2xl:inline-flex">
                    {filteredNotifications.length} results
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

            {filteredNotifications.length === 0 ? (
              <div className="px-6 py-12">
                <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300">
                    <Bell className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-slate-100">
                    {activeFilter === "unread"
                      ? "No unread notifications"
                      : "No notifications found"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {activeFilter === "unread"
                      ? "Everything is up to date right now."
                      : "Workflow updates will appear here as requests move through the system."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/8">
                {filteredNotifications.map((notification) => {
                  const target = buildNotificationTarget(
                    notification,
                    currentUser?.role
                  );

                  return (
                    <div
                      key={notification.id}
                      className={`px-5 py-4 transition lg:px-6 ${
                        notification.read ? "bg-transparent" : "bg-emerald-500/[0.04]"
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={mapNotificationTypeToVariant(notification.type)}
                            >
                              {formatNotificationType(notification.type)}
                            </Badge>
                            {!notification.read ? (
                              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                                Unread
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-3 text-sm font-semibold text-slate-100">
                            {notification.title}
                          </p>
                          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                            {notification.message}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>{formatDateTime(notification.createdAt)}</span>
                            {notification.emailSent ? <span>Email sent</span> : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                          {target ? (
                            <Button
                              asChild
                              variant="secondary"
                              className="gap-2 rounded-2xl px-3 py-2"
                            >
                              <Link to={target}>
                                <span>Open</span>
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          ) : null}

                          {!notification.read ? (
                            <Button
                              variant="ghost"
                              className="rounded-2xl px-3 py-2 text-slate-300"
                              disabled={markReadStatus === "loading"}
                              onClick={() => markNotificationRead(notification.id)}
                            >
                              Mark Read
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default NotificationsPage;
