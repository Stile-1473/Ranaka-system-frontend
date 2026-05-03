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

const requestStatusLabels = {
  DRAFT: "Draft",
  PENDING_ADMIN_RECOMMENDATION: "Waiting for Admin Review",
  RECOMMENDED: "Recommended",
  PENDING_GM_APPROVAL: "Waiting for GM Approval",
  APPROVED_BY_GM: "Approved by GM",
  PENDING_CEO_AUTHORIZATION: "Waiting for CEO Authorization",
  AUTHORIZED: "Approved",
  COMPLETED: "Finished",
  RETURNED_FOR_CORRECTION: "Needs Your Correction",
  REJECTED: "Not Approved",
};

const workflowStageLabels = {
  DRAFT: "Still with you",
  ADMIN_RECOMMENDATION: "Admin is reviewing",
  GM_APPROVAL: "GM is reviewing",
  CEO_AUTHORIZATION: "CEO is reviewing",
  COMPLETED: "Finished",
};

const approvalActionLabels = {
  RECOMMEND: "Recommended",
  APPROVE: "Approved",
  AUTHORIZE: "Authorized",
  REJECT: "Not approved",
  RETURN_FOR_CORRECTION: "Sent back for correction",
};

export const formatRequestStatus = (status, isOverdue = false) => {
  if (isOverdue) {
    return "Overdue";
  }

  return requestStatusLabels[status] || formatEnumLabel(status) || "Unknown";
};

export const formatPriority = (priority) =>
  formatEnumLabel(priority) || "Not set";

export const formatWorkflowStage = (stage) =>
  workflowStageLabels[stage] || formatEnumLabel(stage) || "Not assigned";

export const formatApprovalAction = (action) =>
  approvalActionLabels[action] || formatEnumLabel(action) || "No action";

export const getRequestNextStep = (request) => {
  if (!request) return "Open the request to see what to do next.";
  if (request.isOverdue) return "This request needs attention because it is overdue.";

  switch (request.status) {
    case "DRAFT":
      return "Finish the draft and submit it when ready.";
    case "RETURNED_FOR_CORRECTION":
      return "Review the feedback, make changes, then resubmit.";
    case "PENDING_ADMIN_RECOMMENDATION":
      return "No action needed. Admin is reviewing it.";
    case "PENDING_GM_APPROVAL":
      return "No action needed. It is waiting for GM approval.";
    case "PENDING_CEO_AUTHORIZATION":
      return "No action needed. It is waiting for final authorization.";
    case "AUTHORIZED":
    case "COMPLETED":
      return "This request is complete.";
    case "REJECTED":
      return "This request was not approved. Open it to read the reason.";
    default:
      return "Open the request to see the latest details.";
  }
};

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
