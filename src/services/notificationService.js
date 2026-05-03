import axiosConfig from "../axios/axiosConfig";
import notificationApi from "../apis/notificationApi";

export const getUnreadCount = async () => {
  // Response shape: { unreadCount: number }
  const response = await axiosConfig.get(notificationApi.UNREAD_COUNT);
  return response.data;
};

export const getNotifications = async (params = {}) => {
  const response = await axiosConfig.get(notificationApi.MY, { params });
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await axiosConfig.patch(notificationApi.MARK_READ(notificationId));
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await axiosConfig.patch(notificationApi.MARK_ALL_READ);
  return response.data;
};
