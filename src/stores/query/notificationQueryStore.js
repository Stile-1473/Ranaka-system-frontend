import { create } from "zustand";
import {
  getNotifications,
  getUnreadCount,
} from "../../services/notificationService";
import { createBaseQueryStore } from "../base/createBaseQueryStore";

const emptyNotificationsPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 10,
};

// Query store for the notification badge count in the header.
const createUnreadQuery = createBaseQueryStore({
  dataKey: "unreadCount",
  statusKey: "unreadStatus",
  errorKey: "unreadError",
  actionName: "fetchUnreadCount",
  initialData: 0,
  queryFn: getUnreadCount,
  transformResponse: (response) => response?.unreadCount ?? 0,
});

const createNotificationsQuery = createBaseQueryStore({
  dataKey: "notificationsPage",
  statusKey: "notificationsStatus",
  errorKey: "notificationsError",
  actionName: "fetchNotifications",
  initialData: emptyNotificationsPage,
  queryFn: getNotifications,
  transformResponse: (response) => ({
    ...emptyNotificationsPage,
    ...response,
    content: Array.isArray(response?.content) ? response.content : [],
  }),
});

export const useNotificationQueryStore = create((set, get) => ({
  ...createUnreadQuery(set, get),
  ...createNotificationsQuery(set, get),
  setUnreadCount(unreadCount) {
    // Called by the live WebSocket stream when the backend pushes a new count.
    set({ unreadCount });
  },
  incrementUnread() {
    // Small helper for future optimistic notification flows.
    set((state) => ({ unreadCount: state.unreadCount + 1 }));
  },
  decrementUnread() {
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) }));
  },
  appendNotification(notification) {
    set((state) => {
      const currentPage = state.notificationsPage || emptyNotificationsPage;
      const currentContent = Array.isArray(currentPage.content)
        ? currentPage.content
        : [];

      if (currentContent.some((item) => item.id === notification?.id)) {
        return state;
      }

      const nextSize = currentPage.size || 10;
      return {
        notificationsPage: {
          ...currentPage,
          content: [notification, ...currentContent].slice(0, nextSize),
          totalElements: (currentPage.totalElements || 0) + 1,
        },
      };
    });
  },
  markNotificationReadLocal(notificationId, readAt = new Date().toISOString()) {
    set((state) => {
      const currentPage = state.notificationsPage || emptyNotificationsPage;
      const nextContent = (currentPage.content || []).map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true, readAt }
          : notification
      );

      return {
        notificationsPage: {
          ...currentPage,
          content: nextContent,
        },
      };
    });
  },
  markAllNotificationsReadLocal(readAt = new Date().toISOString()) {
    set((state) => {
      const currentPage = state.notificationsPage || emptyNotificationsPage;

      return {
        notificationsPage: {
          ...currentPage,
          content: (currentPage.content || []).map((notification) => ({
            ...notification,
            read: true,
            readAt,
          })),
        },
      };
    });
  },
  resetNotificationsState() {
    set({
      unreadCount: 0,
      unreadStatus: "idle",
      unreadError: null,
      notificationsPage: emptyNotificationsPage,
      notificationsStatus: "idle",
      notificationsError: null,
    });
  },
}));
