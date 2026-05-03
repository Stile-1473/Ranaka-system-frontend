import { useEffect, useMemo, useState } from "react";
import { CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/feedback/EmptyState";
import { useNotificationQueryStore } from "../../stores/query/notificationQueryStore";
import { useNotificationMutationStore } from "../../stores/mutation/notificationMutationStore";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import {
  buildNotificationTarget,
  formatNotificationType,
  mapNotificationTypeToVariant,
} from "../../utils/notificationHelpers";
import { formatDateTime } from "../../utils/dateFormatters";

function NotificationsPage() {
  const currentUser = useCurrentUser();
  const [activeFilter, setActiveFilter] = useState("all");
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
    fetchNotifications({ page: 0, size: 20 });
  }, [fetchNotifications]);

  const notifications = notificationsPage?.content ?? [];
  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return notifications.filter((notification) => !notification.read);
    }

    return notifications;
  }, [activeFilter, notifications]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Notifications
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Workflow updates and reminders for your account.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={unreadCount > 0 ? "warning" : "neutral"}>
            {unreadCount} unread
          </Badge>
          <Button
            variant="secondary"
            className="gap-2"
            disabled={unreadCount === 0 || markAllReadStatus === "loading"}
            onClick={() => markAllNotificationsRead()}
          >
            <CheckCheck className="h-4 w-4" />
            {markAllReadStatus === "loading" ? "Marking..." : "Mark All Read"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={activeFilter === "all" ? "primary" : "secondary"}
            className="px-3 py-2"
            onClick={() => setActiveFilter("all")}
          >
            All
          </Button>
          <Button
            variant={activeFilter === "unread" ? "primary" : "secondary"}
            className="px-3 py-2"
            onClick={() => setActiveFilter("unread")}
          >
            Unread
          </Button>
      </div>

      {notificationsStatus === "loading" ? (
        <Card>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-sm text-slate-500">
            Loading notifications...
          </div>
        </Card>
      ) : notificationsError ? (
        <Card>
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-10 text-sm text-rose-700">
            {notificationsError}
          </div>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title={
            activeFilter === "unread"
              ? "No unread notifications"
              : "No notifications yet"
          }
          description={
            activeFilter === "unread"
              ? "Everything is up to date right now."
              : "Workflow updates will appear here as requests move through the system."
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="divide-y divide-slate-200">
            {filteredNotifications.map((notification) => {
              const target = buildNotificationTarget(
                notification,
                currentUser?.role
              );

              return (
                <div
                  key={notification.id}
                  className={`px-5 py-4 transition ${notification.read ? "bg-white" : "bg-slate-50"}`}
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
                          <span className="text-xs font-medium text-slate-700">
                            Unread
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        {notification.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>{formatDateTime(notification.createdAt)}</span>
                        {notification.emailSent ? <span>Email sent</span> : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                      {target ? (
                        <Button asChild variant="secondary" className="px-3 py-2">
                          <Link to={target}>Open Request</Link>
                        </Button>
                      ) : null}
                      {!notification.read ? (
                        <Button
                          variant="secondary"
                          className="px-3 py-2"
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
        </Card>
      )}
    </div>
  );
}

export default NotificationsPage;
