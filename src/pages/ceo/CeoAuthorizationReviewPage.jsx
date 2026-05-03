import { useEffect, useState } from "react";
import { BadgeCheck, ChevronDown, RotateCcw, XCircle } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import TextareaField from "../../components/forms/TextareaField";
import RequestPriorityBadge from "../../components/requests/RequestPriorityBadge";
import RequestStatusBadge from "../../components/requests/RequestStatusBadge";
import { useApprovalMutationStore } from "../../stores/mutation/approvalMutationStore";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import { extractApiErrorMessage } from "../../utils/errorHelpers";
import { formatDate, formatDateTime } from "../../utils/dateFormatters";
import {
  formatApprovalAction,
  formatCurrency,
  formatFileSize,
  formatWorkflowStage,
} from "../../utils/requestHelpers";

function DetailMeta({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InfoCard({ label, value, helper }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

function CollapsibleSection({ title, badge, isExpanded, onToggle, children }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {badge}
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

function CeoAuthorizationReviewPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [actionError, setActionError] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    lineItems: true,
    history: true,
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
  const authorizeExistingRequest = useApprovalMutationStore(
    (state) => state.authorizeExistingRequest
  );
  const rejectExistingRequest = useApprovalMutationStore(
    (state) => state.rejectExistingRequest
  );
  const returnExistingRequest = useApprovalMutationStore(
    (state) => state.returnExistingRequest
  );
  const authorizeStatus = useApprovalMutationStore(
    (state) => state.authorizeStatus
  );
  const rejectStatus = useApprovalMutationStore((state) => state.rejectStatus);
  const returnStatus = useApprovalMutationStore((state) => state.returnStatus);
  const resetApprovalMutationState = useApprovalMutationStore(
    (state) => state.resetApprovalMutationState
  );

  useEffect(() => {
    if (!requestId) {
      return;
    }

    fetchRequestDetails(requestId);
    resetApprovalMutationState();
  }, [fetchRequestDetails, requestId, resetApprovalMutationState]);

  const toggleSection = (sectionKey) => {
    setExpandedSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  };

  const busy =
    authorizeStatus === "loading" ||
    rejectStatus === "loading" ||
    returnStatus === "loading";

  const handleAction = async (action) => {
    const trimmedComment = comment.trim();

    if ((action === "reject" || action === "return") && !trimmedComment) {
      setActionError(
        action === "reject"
          ? "A rejection reason is required."
          : "A return reason is required."
      );
      return;
    }

    setActionError("");

    try {
      if (action === "authorize") {
        await authorizeExistingRequest(requestId, { comment: trimmedComment || null });
        toast.success("Request authorized", {
          description: "The request has been completed and the requester notified.",
        });
      }

      if (action === "reject") {
        await rejectExistingRequest(requestId, { comment: trimmedComment });
        toast.success("Request rejected", {
          description: "The requester has been notified of the rejection.",
        });
      }

      if (action === "return") {
        await returnExistingRequest(requestId, { comment: trimmedComment });
        toast.success("Request returned", {
          description: "The requester can now correct and resubmit it.",
        });
      }

      navigate("/ceo/authorizations");
    } catch (error) {
      toast.error("Could not complete action", {
        description: extractApiErrorMessage(error),
      });
    }
  };

  if (requestDetailsStatus === "loading" && !requestDetails) {
    return (
      <Card>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-sm text-slate-500">
          Loading request review...
        </div>
      </Card>
    );
  }

  if (requestDetailsStatus === "error") {
    return (
      <Card>
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-10 text-sm text-rose-700">
          {requestDetailsError || "We could not load this request."}
        </div>
      </Card>
    );
  }

  if (!requestDetails) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {requestDetails.title}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <RequestStatusBadge
              status={requestDetails.status}
              isOverdue={requestDetails.isOverdue}
            />
            <RequestPriorityBadge priority={requestDetails.priority} />
            <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {formatWorkflowStage(requestDetails.currentStage)}
            </span>
          </div>
        </div>
        <Button asChild variant="secondary">
          <Link to="/ceo/authorizations">Back to Queue</Link>
        </Button>
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
          label="Requester"
          value={requestDetails.requesterName}
          helper={requestDetails.requesterEmail}
        />
        <InfoCard
          label="Submitted"
          value={
            requestDetails.submittedAt
              ? formatDateTime(requestDetails.submittedAt)
              : "Not submitted"
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
                label="Return Count"
                value={String(requestDetails.returnCount || 0)}
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
                {requestDetails.lineItems?.length || 0} items
              </span>
            }
          >
            <div className="space-y-4">
              {(requestDetails.lineItems || []).map((item, index) => (
                <div
                  key={item.id || `${item.itemDescription}-${index}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.itemDescription}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>Qty {item.quantity}</span>
                        <span>{item.unit || "No unit"}</span>
                        <span>{formatCurrency(item.unitCost)}</span>
                      </div>
                      {item.notes ? (
                        <p className="text-sm leading-6 text-slate-600">{item.notes}</p>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(item.totalCost)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Approval History"
            isExpanded={expandedSections.history}
            onToggle={() => toggleSection("history")}
            badge={
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {requestDetails.approvalHistory?.length || 0} entries
              </span>
            }
          >
            {requestDetails.approvalHistory?.length ? (
              <div className="space-y-4">
                {requestDetails.approvalHistory.map((approval) => (
                  <div
                    key={approval.id}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-4"
                  >
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatApprovalAction(approval.action)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {approval.approverName} • {approval.approverRole}
                        </p>
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(approval.actionDate)}
                      </p>
                    </div>
                    {approval.comment ? (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {approval.comment}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No approval history yet.</p>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="Comments"
            isExpanded={expandedSections.comments}
            onToggle={() => toggleSection("comments")}
            badge={
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {requestDetails.comments?.length || 0} comments
              </span>
            }
          >
            {requestDetails.comments?.length ? (
              <div className="space-y-4">
                {requestDetails.comments.map((commentEntry) => (
                  <div
                    key={commentEntry.id}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-4"
                  >
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {commentEntry.commenterName}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {commentEntry.commenterRole}
                        </p>
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(commentEntry.createdAt)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {commentEntry.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No comments on this request yet.</p>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="Attachments"
            isExpanded={expandedSections.attachments}
            onToggle={() => toggleSection("attachments")}
            badge={
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {requestDetails.attachments?.length || 0} files
              </span>
            }
          >
            {requestDetails.attachments?.length ? (
              <div className="space-y-3">
                {requestDetails.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {attachment.fileName}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>{attachment.contentType || "Unknown type"}</span>
                      <span>{formatFileSize(attachment.fileSize)}</span>
                      <span>{formatDateTime(attachment.uploadedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No attachments were added.</p>
            )}
          </CollapsibleSection>
        </div>

        <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <Card>
            <h3 className="text-lg font-semibold text-slate-900">CEO Decision</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add a comment if needed, then authorize, return, or reject the request.
            </p>

            <div className="mt-5">
              <TextareaField
                label="Comment"
                rows={5}
                placeholder="Optional for authorize. Required for return or reject."
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                error={actionError}
              />
            </div>

            <div className="mt-5 space-y-3">
              <Button
                className="w-full gap-2"
                disabled={busy}
                onClick={() => handleAction("authorize")}
              >
                <BadgeCheck className="h-4 w-4" />
                {authorizeStatus === "loading" ? "Authorizing..." : "Authorize"}
              </Button>
              <Button
                variant="secondary"
                className="w-full gap-2 border-amber-200 text-amber-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                disabled={busy}
                onClick={() => handleAction("return")}
              >
                <RotateCcw className="h-4 w-4" />
                {returnStatus === "loading" ? "Returning..." : "Return for Correction"}
              </Button>
              <Button
                variant="secondary"
                className="w-full gap-2 border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800"
                disabled={busy}
                onClick={() => handleAction("reject")}
              >
                <XCircle className="h-4 w-4" />
                {rejectStatus === "loading" ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CeoAuthorizationReviewPage;
