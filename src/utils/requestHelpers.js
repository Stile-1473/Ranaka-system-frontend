// Shared helpers for request-focused pages so status, priority, and money
// formatting stay consistent across dashboard cards, tables, and detail views.

export const mapRequestStatusToVariant = (status, isOverdue = false) => {
  if (isOverdue) return "danger";

  switch (status) {
    case "COMPLETED":
    case "AUTHORIZED":
    case "APPROVED_BY_GM":
    case "RECOMMENDED":
      return "success";
    case "RETURNED_FOR_CORRECTION":
    case "PENDING_ADMIN_RECOMMENDATION":
    case "PENDING_GM_APPROVAL":
    case "PENDING_CEO_AUTHORIZATION":
      return "warning";
    case "REJECTED":
      return "danger";
    default:
      return "neutral";
  }
};

export const mapPriorityToVariant = (priority) => {
  switch (priority) {
    case "CRITICAL":
      return "danger";
    case "HIGH":
      return "warning";
    case "MEDIUM":
      return "success";
    default:
      return "neutral";
  }
};

export const formatEnumLabel = (value) =>
  String(value || "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");

export const formatRequestStatus = (status, isOverdue = false) => {
  if (isOverdue) {
    return "Overdue";
  }

  return formatEnumLabel(status) || "Unknown";
};

export const formatPriority = (priority) =>
  formatEnumLabel(priority) || "Not set";

export const formatWorkflowStage = (stage) =>
  formatEnumLabel(stage) || "Not assigned";

export const formatApprovalAction = (action) =>
  formatEnumLabel(action) || "No action";

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  return new Intl.NumberFormat("en-ZW", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value));
};

export const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
