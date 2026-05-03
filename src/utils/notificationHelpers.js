import { formatEnumLabel } from "./requestHelpers";

export const formatNotificationType = (type) =>
  formatEnumLabel(type) || "Notification";

export const mapNotificationTypeToVariant = (type) => {
  switch (type) {
    case "REQUEST_REJECTED":
    case "REQUEST_OVERDUE":
      return "danger";
    case "REQUEST_RETURNED":
    case "REMINDER_TRIGGERED":
      return "warning";
    case "REQUEST_COMPLETED":
      return "success";
    default:
      return "neutral";
  }
};

export const buildNotificationTarget = (notification, currentUserRole) => {
  if (
    notification?.referenceType === "PROCUREMENT_REQUEST" &&
    notification?.referenceId &&
    currentUserRole === "REQUESTER"
  ) {
    return `/requests/${notification.referenceId}`;
  }

  return null;
};
