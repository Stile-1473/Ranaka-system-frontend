import { useEffect } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  CornerUpLeft,
  AlertTriangle,
  FileText,
  Paperclip,
  Send,
  TimerReset,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import RequestPriorityBadge from "../../components/requests/RequestPriorityBadge";
import RequestStatusBadge from "../../components/requests/RequestStatusBadge";
import { useRequestMutationStore } from "../../stores/mutation/requestMutationStore";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import { formatDate, formatDateTime } from "../../utils/dateFormatters";
import {
  formatApprovalAction,
  formatCurrency,
  formatFileSize,
  formatWorkflowStage,
  getRequestNextStep,
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

function SummaryStat({ label, value, helper }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-4 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.95)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-100">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/6 py-3 last:border-b-0 last:pb-0 first:pt-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-100 sm:max-w-[60%] sm:text-right">
        {value}
      </p>
    </div>
  );
}

function EmptyBlock({ message }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-sm text-slate-400">
      {message}
    </div>
  );
}

function RequestDetailsPage() {
  const { requestId } = useParams();
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

  const handleSubmitRequest = async () => {
    try {
      await submitExistingRequest(requestId);
      await fetchRequestDetails(requestId);

      toast.success("Request submitted", {
        description: "It is now waiting for Admin review.",
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
        <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-10 text-sm text-slate-400">
          Loading request details...
        </div>
      </Card>
    );
  }

  if (requestDetailsStatus === "error") {
    return (
      <Card>
        <div className="rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 px-4 py-10 text-sm text-rose-200">
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
  const workflowIndex = getWorkflowIndex(requestDetails);
  const latestDecisionEntry = [...(requestDetails.approvalHistory || [])].find(
    (entry) =>
      entry.action === "RETURN_FOR_CORRECTION" || entry.action === "REJECT"
  );
  const needsDecisionAttention =
    requestDetails.status === "RETURNED_FOR_CORRECTION" ||
    requestDetails.status === "REJECTED";
  const latestWorkflowEntry = (requestDetails.approvalHistory || [])[0];

  return (
    <div className="space-y-6">
      <Card className="space-y-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="ghost" className="h-10 rounded-2xl px-3">
                <Link to="/requests">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to My Requests</span>
                </Link>
              </Button>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Procurement Request
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50 lg:text-3xl">
                {requestDetails.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                {getRequestNextStep(requestDetails)}
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

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            {canSubmit ? (
              <Button asChild variant="secondary" className="rounded-2xl px-4">
                <Link to={`/requests/${requestDetails.id}/edit`}>
                  <CornerUpLeft className="h-4 w-4" />
                  <span>
                    {requestDetails.status === "DRAFT"
                      ? "Continue Draft"
                      : "Edit Request"}
                  </span>
                </Link>
              </Button>
            ) : null}
            {canSubmit ? (
              <Button
                type="button"
                className="rounded-2xl px-4"
                disabled={submitRequestStatus === "loading"}
                onClick={handleSubmitRequest}
              >
                <Send className="h-4 w-4" />
                <span>
                  {submitRequestStatus === "loading"
                    ? "Submitting..."
                    : "Submit Request"}
                </span>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryStat
            label="Estimated Total"
            value={formatCurrency(requestDetails.estimatedCost)}
          />
          <SummaryStat
            label="Required By"
            value={formatDate(requestDetails.requiredByDate)}
          />
          <SummaryStat
            label="Current Stage"
            value={formatWorkflowStage(requestDetails.currentStage)}
          />
          <SummaryStat
            label="Created"
            value={formatDateTime(requestDetails.createdAt)}
          />
        </div>

        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {workflowSteps.map((step, index) => {
              const isDone = index < workflowIndex;
              const isCurrent = index === workflowIndex;

              return (
                <div
                  key={step.key}
                  className={`rounded-[1.25rem] border px-4 py-3 transition ${
                    isDone || isCurrent
                      ? "border-emerald-400/20 bg-emerald-500/10"
                      : "border-white/8 bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold ${
                        isDone || isCurrent
                          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                          : "border-white/10 bg-white/[0.03] text-slate-500"
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
                  <p className="mt-2 text-xs text-slate-500">
                    {isCurrent ? "Current stage" : isDone ? "Completed" : "Pending"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_0.85fr]">
        <div className="space-y-6">
          {needsDecisionAttention && latestDecisionEntry?.comment ? (
            <Card className="border border-amber-500/20 bg-amber-500/10">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-200" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-100">
                    {requestDetails.status === "REJECTED"
                      ? "Latest rejection note"
                      : "Latest correction note"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-amber-50/90">
                    {latestDecisionEntry.comment}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-amber-200/70">
                    {latestDecisionEntry.approverName} • {latestDecisionEntry.approverRole}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5">
                <FileText className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Overview</h2>
                <p className="text-sm text-slate-400">
                  Core request information and business context.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <SummaryStat label="Department" value={requestDetails.departmentName} />
              <SummaryStat label="Requester" value={requestDetails.requesterName} />
            </div>

            <div className="mt-6 grid gap-6">
              <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-5 py-5">
                <p className="text-sm font-semibold text-slate-200">Description</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {requestDetails.description || "No description provided."}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-5 py-5">
                <p className="text-sm font-semibold text-slate-200">Justification</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {requestDetails.justification || "No justification provided."}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5">
                  <ClipboardList className="h-4 w-4 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Line Items</h2>
                  <p className="text-sm text-slate-400">
                    {requestDetails.lineItems?.length || 0} item(s) included in this request.
                  </p>
                </div>
              </div>
            </div>

            {(requestDetails.lineItems || []).length === 0 ? (
              <div className="mt-6">
                <EmptyBlock message="No line items were added to this request." />
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/8 bg-slate-950/40">
                <div className="grid gap-3 p-3 md:hidden">
                  {(requestDetails.lineItems || []).map((item, index) => (
                    <div
                      key={item.id || `${item.itemDescription}-${index}-mobile`}
                      className="rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 py-4"
                    >
                      <p className="font-medium text-slate-100">
                        {item.itemDescription || `Item ${index + 1}`}
                      </p>
                      {item.notes ? (
                        <p className="mt-2 text-xs leading-6 text-slate-400">
                          {item.notes}
                        </p>
                      ) : null}

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                            Qty
                          </p>
                          <p className="mt-1 text-slate-200">{item.quantity ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                            Unit
                          </p>
                          <p className="mt-1 text-slate-200">{item.unit || "Not set"}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                            Unit Cost
                          </p>
                          <p className="mt-1 text-slate-200">{formatCurrency(item.unitCost)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                            Total
                          </p>
                          <p className="mt-1 font-medium text-slate-50">
                            {formatCurrency(item.totalCost)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-[1.1rem] border border-white/8 bg-white/[0.04] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Total Estimated Cost
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-50">
                      {formatCurrency(requestDetails.estimatedCost)}
                    </p>
                  </div>
                </div>

                <div className="hidden overflow-x-auto md:block">
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
                        <tr
                          key={item.id || `${item.itemDescription}-${index}`}
                          className="align-top transition hover:bg-white/[0.03]"
                        >
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
                          <td className="px-4 py-4 text-slate-300">
                            {item.quantity ?? 0}
                          </td>
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
                      <tr className="bg-white/[0.03]">
                        <td
                          colSpan={4}
                          className="px-4 py-4 text-right text-sm font-semibold text-slate-300"
                        >
                          Total Estimated Cost
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-50">
                          {formatCurrency(requestDetails.estimatedCost)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-100">Approval History</h2>
            <p className="mt-1 text-sm text-slate-400">
              Review actions and comments recorded on this request.
            </p>

            {(requestDetails.approvalHistory || []).length === 0 ? (
              <div className="mt-6">
                <EmptyBlock message="No approval actions have been recorded yet." />
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {requestDetails.approvalHistory.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-5 py-5"
                  >
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="mt-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 p-2">
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
                              {formatApprovalAction(entry.action)}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                              {entry.approverName} • {entry.approverRole}
                            </p>
                          </div>
                          <div className="text-sm text-slate-400 lg:text-right">
                            <p>{formatWorkflowStage(entry.stage)}</p>
                            <p className="mt-1">{formatDateTime(entry.actionDate)}</p>
                          </div>
                        </div>
                        {entry.comment ? (
                          <p className="mt-4 text-sm leading-7 text-slate-300">
                            {entry.comment}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-100">Comments</h2>
            <p className="mt-1 text-sm text-slate-400">
              Internal and workflow notes attached to the request.
            </p>

            {(requestDetails.comments || []).length === 0 ? (
              <div className="mt-6">
                <EmptyBlock message="No comments have been added yet." />
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {requestDetails.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-5 py-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-100">
                          {comment.commenterName}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                          {comment.commenterRole}
                          {comment.isInternal ? " • Internal" : ""}
                        </p>
                      </div>
                      <p className="text-sm text-slate-400">
                        {formatDateTime(comment.createdAt)}
                      </p>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      {comment.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5">
                <Paperclip className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Attachments</h2>
                <p className="text-sm text-slate-400">
                  Files uploaded with this request.
                </p>
              </div>
            </div>

            {(requestDetails.attachments || []).length === 0 ? (
              <div className="mt-6">
                <EmptyBlock message="No attachments were uploaded for this request." />
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {requestDetails.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-5 py-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-100">
                          {attachment.fileName}
                        </p>
                        <div className="mt-2 space-y-1 text-sm text-slate-400">
                          <p>{attachment.contentType || "Unknown file type"}</p>
                          <p>{formatFileSize(attachment.fileSize)}</p>
                          <p>Uploaded by {attachment.uploadedByName}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">
                        {formatDateTime(attachment.uploadedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <Card>
            <h2 className="text-lg font-semibold text-slate-100">
              Workflow Progress
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Track where the request is currently sitting in the approval chain.
            </p>

            <div className="mt-6 space-y-4">
              {workflowSteps.map((step, index) => {
                const isDone = index < workflowIndex;
                const isCurrent = index === workflowIndex;

                return (
                  <div key={step.key} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold transition ${
                          isDone || isCurrent
                            ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                            : "border-white/10 bg-white/[0.04] text-slate-500"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <CircleDot className="h-4 w-4" />
                        )}
                      </div>
                      {index < workflowSteps.length - 1 ? (
                        <div className="my-2 h-8 w-px bg-white/10" />
                      ) : null}
                    </div>
                    <div className="pt-1">
                      <p
                        className={`text-sm font-medium ${
                          isDone || isCurrent ? "text-slate-100" : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {isCurrent
                          ? "Current stage"
                          : isDone
                            ? "Completed"
                            : "Waiting"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-100">Request Info</h2>
            <div className="mt-5">
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
                label="Status"
                value={formatWorkflowStage(requestDetails.currentStage)}
              />
              <InfoRow
                label="Last Updated"
                value={formatDateTime(requestDetails.updatedAt || requestDetails.createdAt)}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-100">Latest Activity</h2>
            {latestWorkflowEntry ? (
              <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-sm font-medium text-slate-100">
                  {formatApprovalAction(latestWorkflowEntry.action)}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {latestWorkflowEntry.approverName} • {latestWorkflowEntry.approverRole}
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  {latestWorkflowEntry.comment || "No additional note was recorded."}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {formatDateTime(latestWorkflowEntry.actionDate)}
                </p>
              </div>
            ) : (
              <div className="mt-5">
                <EmptyBlock message="No workflow action has been recorded yet." />
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-100">Key Dates</h2>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <div>
                    <p className="text-sm font-medium text-slate-100">Created</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatDateTime(requestDetails.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <div>
                    <p className="text-sm font-medium text-slate-100">Required By</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatDate(requestDetails.requiredByDate)}
                    </p>
                  </div>
                </div>
              </div>
              {requestDetails.submittedAt ? (
                <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                  <div className="flex items-start gap-3">
                    <CalendarClock className="mt-0.5 h-4 w-4 text-emerald-300" />
                    <div>
                      <p className="text-sm font-medium text-slate-100">Submitted</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatDateTime(requestDetails.submittedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          {submitRequestError && canSubmit ? (
            <Card className="border border-rose-500/20 bg-rose-500/10">
              <div className="flex items-start gap-3">
                <TimerReset className="mt-0.5 h-5 w-5 text-rose-300" />
                <div>
                  <p className="text-sm font-semibold text-rose-200">
                    Submit action failed
                  </p>
                  <p className="mt-2 text-sm text-rose-100/90">
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
