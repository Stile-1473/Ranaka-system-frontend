import { create } from "zustand";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationService";
import { createBaseMutationStore } from "../base/createBaseMutationStore";
import { useNotificationQueryStore } from "../query/notificationQueryStore";

const createMarkReadMutation = createBaseMutationStore({
  statusKey: "markReadStatus",
  errorKey: "markReadError",
  actionName: "markNotificationRead",
  mutationFn: markNotificationAsRead,
  onSuccess: async (notification) => {
    const notificationStore = useNotificationQueryStore.getState();
    notificationStore.markNotificationReadLocal(
      notification.id,
      notification.readAt
    );
    notificationStore.decrementUnread();
    return notification;
  },
});

const createMarkAllReadMutation = createBaseMutationStore({
  statusKey: "markAllReadStatus",
  errorKey: "markAllReadError",
  actionName: "markAllNotificationsRead",
  mutationFn: markAllNotificationsAsRead,
  onSuccess: async () => {
    const notificationStore = useNotificationQueryStore.getState();
    notificationStore.markAllNotificationsReadLocal();
    notificationStore.setUnreadCount(0);
  },
});

export const useNotificationMutationStore = create((set, get) => ({
  ...createMarkReadMutation(set, get),
  ...createMarkAllReadMutation(set, get),
  resetNotificationMutationState() {
    set({
      markReadStatus: "idle",
      markReadError: null,
      markAllReadStatus: "idle",
      markAllReadError: null,
    });
  },
}));
