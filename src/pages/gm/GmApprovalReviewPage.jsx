import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCheck,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import TextareaField from "../../components/forms/TextareaField";
import RequestPriorityBadge from "../../components/requests/RequestPriorityBadge";
import RequestStatusBadge from "../../components/requests/RequestStatusBadge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { useApprovalMutationStore } from "../../stores/mutation/approvalMutationStore";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import { formatDate, formatDateTime } from "../../utils/dateFormatters";
import { extractApiErrorMessage } from "../../utils/errorHelpers";
import {
  formatApprovalAction,
  formatCurrency,
  formatFileSize,
  formatWorkflowStage,
} from "../../utils/requestHelpers";

const workflowSteps = [
  { key: "DRAFT", label: "Draft" },
  { key: "ADMIN_RECOMMENDATION", label: "Admin Review" },
  { key: "GM_APPROVAL", label: "GM Approval" },
  { key: "CEO_AUTHORIZATION", label: "CEO Authorization" },
  { key: "COMPLETED", label: "Completed" },
];

const getWorkflowIndex = (request) => {
  if (!request) {
    return 0;
  }

  if (request.status === "AUTHORIZED" || request.status === "COMPLETED") {
    return workflowSteps.length - 1;
  }

  const activeIndex = workflowSteps.findIndex(
    (step) => step.key === request.currentStage
  );

  return activeIndex === -1 ? 0 : activeIndex;
};

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/8 py-3 first:pt-0 last:border-b-0 last:pb-0">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="max-w-[60%] text-right text-sm font-medium text-slate-100">
        {value}
      </p>
    </div>
  );
}

function EmptyBlock({ message }) {
  return (
    <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-sm text-slate-400">
      {message}
    </div>
  );
}

function SectionBlock({ title, description, children }) {
  return (
    <Card>
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function DecisionButton({
  icon: Icon,
  label,
  helper,
  tone = "neutral",
  disabled,
  onClick,
}) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/16"
      : tone === "danger"
        ? "border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/16"
        : "border-amber-500/20 bg-amber-500/10 text-amber-200 hover:bg-amber-500/16";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-[1.1rem] border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClasses}`}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/10 p-2.5">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="mt-1 text-xs leading-6 text-current/80">{helper}</p>
        </div>
      </div>
    </button>
  );
}

function GmApprovalReviewPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [actionError, setActionError] = useState("");

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

  const approveExistingRequest = useApprovalMutationStore(
    (state) => state.approveExistingRequest
  );
  const rejectExistingRequest = useApprovalMutationStore(
    (state) => state.rejectExistingRequest
  );
  const returnExistingRequest = useApprovalMutationStore(
    (state) => state.returnExistingRequest
  );
  const approveStatus = useApprovalMutationStore((state) => state.approveStatus);
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

  const busy =
    approveStatus === "loading" ||
    rejectStatus === "loading" ||
    returnStatus === "loading";

  const workflowIndex = getWorkflowIndex(requestDetails);

  const latestCommentRequiringAttention = useMemo(() => {
    return [...(requestDetails?.approvalHistory || [])].find(
      (entry) =>
        entry.action === "RETURN_FOR_CORRECTION" || entry.action === "REJECT"
    );
  }, [requestDetails?.approvalHistory]);

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
      if (action === "approve") {
        await approveExistingRequest(requestId, { comment: trimmedComment || null });
        toast.success("Request approved", {
          description: "The request has moved to CEO authorization.",
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

      navigate("/gm/approvals");
    } catch (error) {
      toast.error("Could not complete action", {
        description: extractApiErrorMessage(error),
      });
    }
  };

  if (requestDetailsStatus === "loading" && !requestDetails) {
    return (
      <Card>
        <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-10 text-sm text-slate-400">
          Loading request review...
        </div>
      </Card>
    );
  }

  if (requestDetailsStatus === "error") {
    return (
      <Card>
        <div className="rounded-[1.2rem] border border-rose-500/20 bg-rose-500/10 px-4 py-10 text-sm text-rose-200">
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
      <Card className="space-y-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <Button asChild variant="ghost" className="h-10 rounded-2xl px-3">
              <Link to="/gm/approvals">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Queue</span>
              </Link>
            </Button>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                GM Approval
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50 lg:text-3xl">
                {requestDetails.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                Review the request from a management perspective, confirm it is ready for executive authorization, and decide whether it should move forward, be returned, or be rejected.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <RequestStatusBadge
                status={requestDetails.status}
                isOverdue={requestDetails.isOverdue}
              />
              <RequestPriorityBadge priority={requestDetails.priority} />
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                {formatWorkflowStage(requestDetails.currentStage)}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[22rem]">
            <SummaryStat
              label="Estimated Total"
              value={formatCurrency(requestDetails.estimatedCost)}
            />
            <SummaryStat
              label="Required By"
              value={formatDate(requestDetails.requiredByDate)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryStat
            label="Submitted"
            value={
              requestDetails.submittedAt
                ? formatDateTime(requestDetails.submittedAt)
                : "Not submitted"
            }
          />
          <SummaryStat label="Requester" value={requestDetails.requesterName} />
          <SummaryStat label="Department" value={requestDetails.departmentName} />
          <SummaryStat
            label="Return Count"
            value={String(requestDetails.returnCount ?? 0)}
          />
        </div>

        <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4">
          <div className="flex flex-wrap gap-3 lg:grid lg:grid-cols-5">
            {workflowSteps.map((step, index) => {
              const isDone = index < workflowIndex;
              const isCurrent = index === workflowIndex;

              return (
                <div
                  key={step.key}
                  className={`rounded-[1.1rem] border px-4 py-3 ${
                    isDone || isCurrent
                      ? "border-emerald-400/20 bg-emerald-500/10"
                      : "border-white/8 bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold ${
                        isDone || isCurrent
                          ? "border-emerald-400/25 bg-emerald-500/15 text-emerald-200"
                          : "border-white/10 bg-white/[0.03] text-slate-400"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <p
                      className={`text-sm font-medium ${
                        isDone || isCurrent ? "text-slate-100" : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_0.85fr]">
        <div className="space-y-6">
          {latestCommentRequiringAttention?.comment ? (
            <Card className="border border-amber-500/20 bg-amber-500/10">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-200" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-100">
                    Latest return or rejection note
                  </p>
                  <p className="mt-2 text-sm leading-7 text-amber-50/90">
                    {latestCommentRequiringAttention.comment}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          <SectionBlock
            title="Overview"
            description="Core request context for management approval."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <SummaryStat label="Department" value={requestDetails.departmentName} />
              <SummaryStat
                label="Workflow"
                value={formatWorkflowStage(requestDetails.currentStage)}
              />
            </div>

            <div className="mt-5 grid gap-5">
              <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-5 py-5">
                <p className="text-sm font-semibold text-slate-200">Description</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {requestDetails.description || "No description provided."}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-5 py-5">
                <p className="text-sm font-semibold text-slate-200">Justification</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {requestDetails.justification || "No justification provided."}
                </p>
              </div>
            </div>
          </SectionBlock>

          <SectionBlock
            title="Line Items"
            description={`${requestDetails.lineItems?.length || 0} item(s) included in this request.`}
          >
            {(requestDetails.lineItems || []).length === 0 ? (
              <EmptyBlock message="No line items were added to this request." />
            ) : (
              <div className="overflow-hidden rounded-[1.35rem] border border-white/8 bg-slate-950/40">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/6 text-sm">
                    <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Item</th>
                        <th className="px-4 py-3 font-semibold">Qty</th>
                        <th className="px-4 py-3 font-semibold">Unit</th>
                        <th className="px-4 py-3 font-semibold">Unit Cost</th>
                        <th className="px-4 py-3 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/6">
                      {(requestDetails.lineItems || []).map((item, index) => (
                        <tr key={item.id || `${item.itemDescription}-${index}`}>
                          <td className="px-4 py-4">
                            <p className="font-medium text-slate-100">
                              {item.itemDescription || `Item ${index + 1}`}
                            </p>
                            {item.notes ? (
                              <p className="mt-2 max-w-xl text-xs leading-6 text-slate-400">
                                {item.notes}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-4 py-4 text-slate-300">{item.quantity}</td>
                          <td className="px-4 py-4 text-slate-300">
                            {item.unit || "Not set"}
                          </td>
                          <td className="px-4 py-4 text-slate-300">
                            {formatCurrency(item.unitCost)}
                          </td>
                          <td className="px-4 py-4 font-medium text-slate-100">
                            {formatCurrency(item.totalCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-white/8 bg-white/[0.02]">
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
                        >
                          Estimated Total
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-100">
                          {formatCurrency(requestDetails.estimatedCost)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </SectionBlock>

          <SectionBlock
            title="Approval History"
            description="Review the audit trail before deciding what should happen next."
          >
            {(requestDetails.approvalHistory || []).length ? (
              <div className="space-y-4">
                {requestDetails.approvalHistory.map((approval, index) => (
                  <div
                    key={approval.id}
                    className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-5 py-5"
                  >
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 p-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        </div>
                        {index < requestDetails.approvalHistory.length - 1 ? (
                          <div className="mt-2 h-full min-h-8 w-px bg-white/10" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="font-medium text-slate-100">
                              {formatApprovalAction(approval.action)}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                              {approval.approverName} • {approval.approverRole}
                            </p>
                          </div>
                          <p className="text-sm text-slate-400">
                            {formatDateTime(approval.actionDate)}
                          </p>
                        </div>
                        {approval.comment ? (
                          <p className="mt-4 text-sm leading-7 text-slate-300">
                            {approval.comment}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBlock message="No approval history has been recorded yet." />
            )}
          </SectionBlock>

          <SectionBlock
            title="Comments"
            description="Discussion and review notes attached to the request."
          >
            {(requestDetails.comments || []).length ? (
              <div className="space-y-4">
                {requestDetails.comments.map((commentEntry) => (
                  <div
                    key={commentEntry.id}
                    className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-5 py-5"
                  >
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-medium text-slate-100">
                          {commentEntry.commenterName}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {commentEntry.commenterRole}
                        </p>
                      </div>
                      <p className="text-sm text-slate-400">
                        {formatDateTime(commentEntry.createdAt)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {commentEntry.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBlock message="No comments have been added yet." />
            )}
          </SectionBlock>

          <SectionBlock
            title="Attachments"
            description="Files supplied with the procurement request."
          >
            {(requestDetails.attachments || []).length ? (
              <div className="space-y-4">
                {requestDetails.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-5 py-5"
                  >
                    <p className="font-medium text-slate-100">{attachment.fileName}</p>
                    <div className="mt-2 space-y-1 text-sm text-slate-400">
                      <p>{attachment.contentType || "Unknown file type"}</p>
                      <p>{formatFileSize(attachment.fileSize)}</p>
                      <p>Uploaded by {attachment.uploadedByName}</p>
                      <p>{formatDateTime(attachment.uploadedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBlock message="No attachments were uploaded for this request." />
            )}
          </SectionBlock>
        </div>

        <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <SectionBlock
            title="Decision Workspace"
            description="Leave a clear note, then choose the action that matches the readiness of this request."
          >
            <TextareaField
              label="Decision Comment"
              placeholder="Add your approval note, correction reason, or rejection reason..."
              description="A reason is required for return and reject actions."
              rows={6}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              error={actionError}
            />

            <div className="mt-5 space-y-3">
              <DecisionButton
                icon={CheckCheck}
                label="Approve to CEO"
                helper="Use this when the request is complete and ready for final executive authorization."
                tone="success"
                disabled={busy}
                onClick={() => handleAction("approve")}
              />

              <DecisionButton
                icon={RotateCcw}
                label="Return for Correction"
                helper="Send it back when details, costing, or supporting information still need attention."
                tone="warning"
                disabled={busy}
                onClick={() => handleAction("return")}
              />

              <DecisionButton
                icon={Ban}
                label="Reject Request"
                helper="Reject only when the request should not move forward in its current form."
                tone="danger"
                disabled={busy}
                onClick={() => handleAction("reject")}
              />
            </div>
          </SectionBlock>

          <SectionBlock
            title="Request Info"
            description="Reference information for the current review."
          >
            <InfoRow label="Requester" value={requestDetails.requesterName} />
            <InfoRow label="Email" value={requestDetails.requesterEmail} />
            <InfoRow
              label="Submitted"
              value={
                requestDetails.submittedAt
                  ? formatDateTime(requestDetails.submittedAt)
                  : "Not submitted"
              }
            />
            <InfoRow
              label="Return Count"
              value={String(requestDetails.returnCount ?? 0)}
            />
            <InfoRow
              label="Last Updated"
              value={formatDateTime(requestDetails.updatedAt || requestDetails.createdAt)}
            />
          </SectionBlock>
        </div>
      </div>
    </div>
  );
}

export default GmApprovalReviewPage;
