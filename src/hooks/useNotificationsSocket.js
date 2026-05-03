import { useEffect } from "react";
import { toast } from "sonner";
import { AUTH_TOKEN_KEY } from "../config/constants";
import { useAuthQueryStore } from "../stores/query/authQueryStore";
import { useNotificationQueryStore } from "../stores/query/notificationQueryStore";
import {
  connectNotificationsSocket,
  disconnectNotificationsSocket,
} from "../services/websocketService";
import { storage } from "../utils/storage";

// Global app hook that manages real-time notifications while a user is signed in.
export const useNotificationsSocket = () => {
  const currentUser = useAuthQueryStore((state) => state.currentUser);
  const setUnreadCount = useNotificationQueryStore((state) => state.setUnreadCount);
  const appendNotification = useNotificationQueryStore(
    (state) => state.appendNotification
  );
  const fetchUnreadCount = useNotificationQueryStore((state) => state.fetchUnreadCount);
  const fetchNotifications = useNotificationQueryStore(
    (state) => state.fetchNotifications
  );

  useEffect(() => {
    const token = storage.get(AUTH_TOKEN_KEY);
    if (!token || !currentUser) return undefined;

    // Pull the latest unread count from the API before the socket starts streaming.
    fetchUnreadCount();

    connectNotificationsSocket({
      token,
      onNotification: (notification) => {
        // New live events surface immediately as toast popups.
        appendNotification(notification);
        // Pull the latest count/list so role switches or multi-tab cases stay in sync.
        fetchUnreadCount();
        fetchNotifications({ page: 0, size: 20 });
        toast(notification?.title || "New update", {
          description: notification?.message || "A new event just arrived.",
        });
      },
      onUnreadCount: (count) => {
        // Keep the header notification badge in sync without a page refresh.
        setUnreadCount(Number(count) || 0);
      },
    });

    return () => {
      // Always disconnect on cleanup so we do not accumulate duplicate listeners.
      disconnectNotificationsSocket();
    };
  }, [
    appendNotification,
    currentUser,
    fetchNotifications,
    fetchUnreadCount,
    setUnreadCount,
  ]);
};
