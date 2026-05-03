import { useEffect, useState } from "react";
import {
  ChevronDown,
  Send,
  TimerReset,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import RequestPriorityBadge from "../../components/requests/RequestPriorityBadge";
import RequestStatusBadge from "../../components/requests/RequestStatusBadge";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import { useRequestMutationStore } from "../../stores/mutation/requestMutationStore";
import { formatDate, formatDateTime } from "../../utils/dateFormatters";
import {
  formatApprovalAction,
  formatCurrency,
  formatFileSize,
  formatWorkflowStage,
} from "../../utils/requestHelpers";

function DetailMeta({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  badge,
  children,
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {badge ? badge : null}
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="gap-2 px-3 py-2"
          onClick={onToggle}
        >
          <span>{isExpanded ? "Collapse" : "Expand"}</span>
          <ChevronDown
            className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`}
          />
        </Button>
      </div>

      {isExpanded ? <div className="mt-5 border-t border-slate-200 pt-5">{children}</div> : null}
    </Card>
  );
}

function InfoCard({ label, value, helper }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

function RequestDetailsPage() {
  const { requestId } = useParams();
  const [expandedItems, setExpandedItems] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    lineItems: true,
    approvalHistory: true,
    comments: false,
    attachments: false,
  });
  const requestDetails = useRequestQueryStore((state) => state.requestDetails);
  const requestDetailsStatus = useRequestQueryStore(
    (state) => state.requestDetailsStatus
  );
  const requestDetailsError = useRequestQueryStore(
    (state) => state.requestDetailsError
  );
  const fetchRequestDetails = useRequestQueryStore(
    (state) => state.fetchRequestDetails
  );
  const submitExistingRequest = useRequestMutationStore(
    (state) => state.submitExistingRequest
  );
  const submitRequestStatus = useRequestMutationStore(
    (state) => state.submitRequestStatus
  );
  const submitRequestError = useRequestMutationStore(
    (state) => state.submitRequestError
  );
  const resetSubmitRequestState = useRequestMutationStore(
    (state) => state.resetSubmitRequestState
  );

  useEffect(() => {
    if (!requestId) {
      return;
    }

    fetchRequestDetails(requestId);
    resetSubmitRequestState();
  }, [fetchRequestDetails, requestId, resetSubmitRequestState]);

  const toggleItemExpanded = (index) => {
    setExpandedItems((current) =>
      current.includes(index)
        ? current.filter((itemIndex) => itemIndex !== index)
        : [...current, index]
    );
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  };

  const handleSubmitRequest = async () => {
    try {
      await submitExistingRequest(requestId);
      await fetchRequestDetails(requestId);

      toast.success("Request submitted", {
        description: "The request is now in the approval workflow.",
      });
    } catch {
      toast.error("Could not submit request", {
        description:
          submitRequestError || "Please try again after reviewing the request.",
      });
    }
  };

  if (requestDetailsStatus === "loading" && !requestDetails) {
    return (
      <Card>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-sm text-slate-500">
          Loading request details...
        </div>
      </Card>
    );
  }

  if (requestDetailsStatus === "error") {
    return (
      <Card>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-10 text-sm text-rose-700">
          {requestDetailsError || "We could not load this request."}
        </div>
      </Card>
    );
  }

  if (!requestDetails) {
    return null;
  }

  const canSubmit =
    requestDetails.status === "DRAFT" ||
    requestDetails.status === "RETURNED_FOR_CORRECTION";
  const commentsCount = requestDetails.comments?.length || 0;
  const attachmentsCount = requestDetails.attachments?.length || 0;
  const approvalsCount = requestDetails.approvalHistory?.length || 0;
  const lineItemsCount = requestDetails.lineItems?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="section-title">Request</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {requestDetails.title}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <RequestStatusBadge
              status={requestDetails.status}
              isOverdue={requestDetails.isOverdue}
            />
            <RequestPriorityBadge priority={requestDetails.priority} />
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {formatWorkflowStage(requestDetails.currentStage)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="secondary">
            <Link to="/requests">Back to My Requests</Link>
          </Button>
          {canSubmit ? (
            <Button asChild variant="secondary">
              <Link to={`/requests/${requestDetails.id}/edit`}>
                {requestDetails.status === "DRAFT"
                  ? "Continue Draft"
                  : "Edit Request"}
              </Link>
            </Button>
          ) : null}
          {canSubmit ? (
            <Button
              type="button"
              className="gap-2"
              disabled={submitRequestStatus === "loading"}
              onClick={handleSubmitRequest}
            >
              <Send className="h-4 w-4" />
              {submitRequestStatus === "loading" ? "Submitting..." : "Submit Request"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          label="Estimated Total"
          value={formatCurrency(requestDetails.estimatedCost)}
        />
        <InfoCard
          label="Required By"
          value={formatDate(requestDetails.requiredByDate)}
        />
        <InfoCard
          label="Created"
          value={formatDateTime(requestDetails.createdAt)}
        />
        <InfoCard
          label="Workflow"
          value={
            requestDetails.submittedAt
              ? `Submitted ${formatDateTime(requestDetails.submittedAt)}`
              : "Draft not submitted"
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_0.85fr]">
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Overview</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <DetailMeta label="Department" value={requestDetails.departmentName} />
              <DetailMeta
                label="Current Stage"
                value={formatWorkflowStage(requestDetails.currentStage)}
              />
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-700">Description</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {requestDetails.description || "No description provided."}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Justification</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {requestDetails.justification || "No justification provided."}
                </p>
              </div>
            </div>
          </Card>

          <CollapsibleSection
            title="Line Items"
            isExpanded={expandedSections.lineItems}
            onToggle={() => toggleSection("lineItems")}
            badge={
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {lineItemsCount} items
              </span>
            }
          >
            <div className="space-y-4">
              {(requestDetails.lineItems || []).map((item, index) => {
                const isExpanded = expandedItems.includes(index);

                return (
                  <div
                    key={item.id || `${item.itemDescription}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          Item {index + 1}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {item.itemDescription}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                            Qty {item.quantity || 0}
                          </span>
                          <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                            {formatCurrency(item.totalCost)}
                          </span>
                          {item.unit ? (
                            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                              {item.unit}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        className="gap-2 px-3 py-2"
                        onClick={() => toggleItemExpanded(index)}
                      >
                        <span>{isExpanded ? "Collapse" : "Expand"}</span>
                        <ChevronDown
                          className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">
                        <DetailMeta
                          label="Quantity"
                          value={String(item.quantity ?? "Not set")}
                        />
                        <DetailMeta
                          label="Unit Cost"
                          value={formatCurrency(item.unitCost)}
                        />
                        <DetailMeta label="Unit" value={item.unit || "Not set"} />
                        <DetailMeta
                          label="Line Total"
                          value={formatCurrency(item.totalCost)}
                        />
                        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-4">
                          <p className="text-sm font-medium text-slate-500">Notes</p>
                          <p className="mt-2 text-sm text-slate-700">
                            {item.notes || "No notes added."}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Approval History"
            isExpanded={expandedSections.approvalHistory}
            onToggle={() => toggleSection("approvalHistory")}
            badge={
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {approvalsCount} entries
              </span>
            }
          >
            <div className="space-y-4">
              {(requestDetails.approvalHistory || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                  No approval actions yet.
                </div>
              ) : (
                requestDetails.approvalHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatApprovalAction(entry.action)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {entry.approverName} • {entry.approverRole}
                        </p>
                      </div>
                      <div className="text-sm text-slate-500 sm:text-right">
                        <p>{formatWorkflowStage(entry.stage)}</p>
                        <p className="mt-1">{formatDateTime(entry.actionDate)}</p>
                      </div>
                    </div>
                    {entry.comment ? (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {entry.comment}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </CollapsibleSection>
        </div>

        <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Requester Actions</h3>
            <div className="mt-5 space-y-3">
              {canSubmit ? (
                <Button asChild variant="secondary" className="w-full gap-2">
                  <Link to={`/requests/${requestDetails.id}/edit`}>
                    {requestDetails.status === "DRAFT"
                      ? "Continue Draft"
                      : "Edit Returned Request"}
                  </Link>
                </Button>
              ) : null}
              {canSubmit ? (
                <Button
                  type="button"
                  className="w-full gap-2"
                  disabled={submitRequestStatus === "loading"}
                  onClick={handleSubmitRequest}
                >
                  <Send className="h-4 w-4" />
                  {submitRequestStatus === "loading"
                    ? "Submitting..."
                    : "Submit Request"}
                </Button>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
                  This request is already in workflow or completed, so there is no requester-side submit action right now.
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Request Info</h3>
            <div className="mt-5 space-y-4">
              <DetailMeta label="Requester" value={requestDetails.requesterName} />
              <DetailMeta label="Email" value={requestDetails.requesterEmail} />
              <DetailMeta label="Created" value={formatDateTime(requestDetails.createdAt)} />
              <DetailMeta
                label="Submitted"
                value={
                  requestDetails.submittedAt
                    ? formatDateTime(requestDetails.submittedAt)
                    : "Not submitted"
                }
              />
              <DetailMeta
                label="Return Count"
                value={String(requestDetails.returnCount ?? 0)}
              />
            </div>
          </Card>

          <CollapsibleSection
            title="Comments"
            isExpanded={expandedSections.comments}
            onToggle={() => toggleSection("comments")}
            badge={
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {commentsCount} comments
              </span>
            }
          >
            <div className="space-y-4">
              {(requestDetails.comments || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                  No comments yet.
                </div>
              ) : (
                requestDetails.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {comment.commenterName}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                          {comment.commenterRole}
                          {comment.isInternal ? " • Internal" : ""}
                        </p>
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(comment.createdAt)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {comment.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Attachments"
            isExpanded={expandedSections.attachments}
            onToggle={() => toggleSection("attachments")}
            badge={
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {attachmentsCount} files
              </span>
            }
          >
            <div className="space-y-4">
              {(requestDetails.attachments || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                  No attachments yet.
                </div>
              ) : (
                requestDetails.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {attachment.fileName}
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-slate-500">
                      <p>{attachment.contentType || "Unknown file type"}</p>
                      <p>{formatFileSize(attachment.fileSize)}</p>
                      <p>Uploaded by {attachment.uploadedByName}</p>
                      <p>{formatDateTime(attachment.uploadedAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CollapsibleSection>

          {submitRequestError && canSubmit ? (
            <Card className="border border-rose-200 bg-rose-50/80">
              <div className="flex items-start gap-3">
                <TimerReset className="mt-0.5 h-5 w-5 text-rose-600" />
                <div>
                  <p className="text-sm font-semibold text-rose-700">
                    Submit action failed
                  </p>
                  <p className="mt-2 text-sm text-rose-700">
                    {submitRequestError}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default RequestDetailsPage;
