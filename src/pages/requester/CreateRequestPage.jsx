import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  ClipboardList,
  FileText,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import InputField from "../../components/forms/InputField";
import TextareaField from "../../components/forms/TextareaField";
import SelectField from "../../components/forms/SelectField";
import { useDepartmentQueryStore } from "../../stores/query/departmentQueryStore";
import { useRequestQueryStore } from "../../stores/query/requestQueryStore";
import { useRequestMutationStore } from "../../stores/mutation/requestMutationStore";
import { REQUEST_PRIORITIES } from "../../config/constants";
import { extractFieldErrors } from "../../utils/errorHelpers";
import { formatCurrency, formatPriority } from "../../utils/requestHelpers";

const lineItemSchema = z.object({
  itemDescription: z
    .string()
    .trim()
    .min(1, "Item description is required"),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity is required" })
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than zero"),
  unitCost: z.coerce
    .number({ invalid_type_error: "Unit cost is required" })
    .min(0, "Unit cost cannot be negative"),
  unit: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const requestSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().min(1, "Description is required").max(2000),
  departmentId: z.coerce
    .number({ invalid_type_error: "Department is required" })
    .positive("Department is required"),
  justification: z.string().trim().min(1, "Justification is required").max(1000),
  priority: z.enum(REQUEST_PRIORITIES, {
    errorMap: () => ({ message: "Priority is required" }),
  }),
  requiredByDate: z
    .string()
    .min(1, "Required by date is required")
    .refine((value) => {
      const selectedDate = new Date(`${value}T00:00:00`);
      const tomorrow = new Date();
      tomorrow.setHours(0, 0, 0, 0);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return selectedDate >= tomorrow;
    }, "Required by date must be in the future"),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

const defaultLineItem = {
  itemDescription: "",
  quantity: 1,
  unitCost: 0,
  unit: "",
  notes: "",
};

const normalizeFieldPath = (path) => path.replace(/\[(\d+)\]/g, ".$1");

const stepDefinitions = [
  {
    key: "details",
    title: "Request Details",
    description: "Add the request details, ownership, and business reason.",
    fields: [
      "title",
      "departmentId",
      "priority",
      "requiredByDate",
      "description",
      "justification",
    ],
  },
  {
    key: "items",
    title: "Line Items",
    description: "Add each requested item with quantity and estimated cost.",
    fields: ["lineItems"],
  },
  {
    key: "summary",
    title: "Summary",
    description: "Review the request details and confirm the totals.",
    fields: [],
  },
  {
    key: "submit",
    title: "Submit",
    description: "Finish the request and send it into workflow.",
    fields: [],
  },
];

function StepBadge({ complete, label }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
        complete
          ? "border-emerald-400/20 bg-emerald-500/12 text-emerald-200"
          : "border-amber-400/20 bg-amber-500/12 text-amber-200"
      }`}
    >
      {label}
    </span>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/8 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="max-w-[60%] text-right text-sm font-medium text-slate-100">
        {value}
      </p>
    </div>
  );
}

function CreateRequestPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(requestId);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedItems, setExpandedItems] = useState([0]);

  const activeDepartments = useDepartmentQueryStore((state) => state.activeDepartments);
  const activeDepartmentsStatus = useDepartmentQueryStore(
    (state) => state.activeDepartmentsStatus
  );
  const activeDepartmentsError = useDepartmentQueryStore(
    (state) => state.activeDepartmentsError
  );
  const fetchActiveDepartments = useDepartmentQueryStore(
    (state) => state.fetchActiveDepartments
  );
  const requestDetails = useRequestQueryStore((state) => state.requestDetails);
  const requestDetailsStatus = useRequestQueryStore(
    (state) => state.requestDetailsStatus
  );
  const fetchRequestDetails = useRequestQueryStore(
    (state) => state.fetchRequestDetails
  );
  const createDraftRequest = useRequestMutationStore(
    (state) => state.createDraftRequest
  );
  const createRequestStatus = useRequestMutationStore(
    (state) => state.createRequestStatus
  );
  const createRequestError = useRequestMutationStore(
    (state) => state.createRequestError
  );
  const submitExistingRequest = useRequestMutationStore(
    (state) => state.submitExistingRequest
  );
  const updateExistingRequest = useRequestMutationStore(
    (state) => state.updateExistingRequest
  );
  const submitRequestStatus = useRequestMutationStore(
    (state) => state.submitRequestStatus
  );
  const submitRequestError = useRequestMutationStore(
    (state) => state.submitRequestError
  );
  const updateRequestStatus = useRequestMutationStore(
    (state) => state.updateRequestStatus
  );
  const updateRequestError = useRequestMutationStore(
    (state) => state.updateRequestError
  );
  const resetRequestMutationState = useRequestMutationStore(
    (state) => state.resetRequestMutationState
  );

  const {
    control,
    register,
    handleSubmit,
    setError,
    reset,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: "",
      description: "",
      departmentId: "",
      justification: "",
      priority: "MEDIUM",
      requiredByDate: "",
      lineItems: [defaultLineItem],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const lineItems = useWatch({ control, name: "lineItems" });
  const watchedTitle = useWatch({ control, name: "title" });
  const watchedDepartmentId = useWatch({ control, name: "departmentId" });
  const watchedPriority = useWatch({ control, name: "priority" });
  const watchedRequiredByDate = useWatch({ control, name: "requiredByDate" });
  const watchedDescription = useWatch({ control, name: "description" });
  const watchedJustification = useWatch({ control, name: "justification" });

  useEffect(() => {
    fetchActiveDepartments();
    if (isEditMode && requestId) {
      fetchRequestDetails(requestId);
    }
    resetRequestMutationState();
  }, [
    fetchActiveDepartments,
    fetchRequestDetails,
    isEditMode,
    requestId,
    resetRequestMutationState,
  ]);

  useEffect(() => {
    if (!isEditMode || !requestDetails || String(requestDetails.id) !== String(requestId)) {
      return;
    }

    reset({
      title: requestDetails.title || "",
      description: requestDetails.description || "",
      departmentId: requestDetails.departmentId || "",
      justification: requestDetails.justification || "",
      priority: requestDetails.priority || "MEDIUM",
      requiredByDate: requestDetails.requiredByDate || "",
      lineItems:
        requestDetails.lineItems?.length > 0
          ? requestDetails.lineItems.map((item) => ({
              itemDescription: item.itemDescription || "",
              quantity: item.quantity ?? 1,
              unitCost: item.unitCost ?? 0,
              unit: item.unit || "",
              notes: item.notes || "",
            }))
          : [defaultLineItem],
    });

    setCurrentStep(0);
    setExpandedItems(
      requestDetails.lineItems?.length
        ? requestDetails.lineItems.map((_, index) => index)
        : [0]
    );
  }, [isEditMode, requestDetails, requestId, reset]);

  useEffect(() => {
    const lineItemErrors = errors.lineItems;

    if (!Array.isArray(lineItemErrors)) {
      return;
    }

    const errorIndexes = lineItemErrors.reduce((indexes, itemError, index) => {
      if (itemError) {
        indexes.push(index);
      }
      return indexes;
    }, []);

    if (!errorIndexes.length) {
      return;
    }

    setExpandedItems((current) => [...new Set([...current, ...errorIndexes])]);
  }, [errors.lineItems]);

  const estimatedTotal = useMemo(() => {
    return (lineItems || []).reduce((sum, item) => {
      const quantity = Number(item?.quantity || 0);
      const unitCost = Number(item?.unitCost || 0);
      return sum + quantity * unitCost;
    }, 0);
  }, [lineItems]);

  const applyBackendValidationErrors = (error) => {
    const fieldErrors = extractFieldErrors(error);

    Object.entries(fieldErrors).forEach(([fieldName, message]) => {
      setError(normalizeFieldPath(fieldName), {
        type: "server",
        message: String(message),
      });
    });
  };

  const buildPayload = (values) => ({
    ...values,
    lineItems: values.lineItems.map((item) => ({
      itemDescription: item.itemDescription.trim(),
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      unit: item.unit?.trim() || null,
      notes: item.notes?.trim() || null,
    })),
  });

  const handleSaveDraft = async (values) => {
    try {
      const savedRequest = isEditMode
        ? await updateExistingRequest(requestId, buildPayload(values))
        : await createDraftRequest(buildPayload(values));

      toast.success(isEditMode ? "Request updated" : "Draft saved", {
        description: isEditMode
          ? "Your request changes have been saved."
          : `Request #${savedRequest.id} is ready for review when you decide to submit it.`,
      });

      navigate(isEditMode ? `/requests/${savedRequest.id}` : "/requests");
    } catch (error) {
      applyBackendValidationErrors(error);
      toast.error(isEditMode ? "Could not update request" : "Could not save draft", {
        description:
          updateRequestError ||
          createRequestError ||
          "Please review the highlighted request fields.",
      });
    }
  };

  const handleSaveAndSubmit = async (values) => {
    let savedRequest = null;

    try {
      savedRequest = isEditMode
        ? await updateExistingRequest(requestId, buildPayload(values))
        : await createDraftRequest(buildPayload(values));
      await submitExistingRequest(savedRequest.id);

      toast.success(isEditMode ? "Request updated and submitted" : "Request submitted", {
        description: isEditMode
          ? "Your corrected request is back in the approval workflow."
          : "Your request has entered the approval workflow.",
      });

      navigate("/requests");
    } catch (error) {
      if (!savedRequest) {
        applyBackendValidationErrors(error);
        toast.error(isEditMode ? "Could not update request" : "Could not create request", {
          description:
            updateRequestError ||
            createRequestError ||
            "Please review the highlighted request fields.",
        });
        return;
      }

      toast.error("Draft saved but submit failed", {
        description:
          submitRequestError ||
          "The draft was created, but we could not push it into the workflow yet.",
      });

      navigate("/requests");
    }
  };

  const isBusy =
    createRequestStatus === "loading" ||
    updateRequestStatus === "loading" ||
    submitRequestStatus === "loading";
  const minimumRequiredDate = new Date(Date.now() + 86400000)
    .toISOString()
    .split("T")[0];
  const selectedDepartment = activeDepartments.find(
    (department) => String(department.id) === String(watchedDepartmentId)
  );

  const requestDetailsComplete = Boolean(
    watchedTitle?.trim() &&
      selectedDepartment &&
      watchedPriority &&
      watchedRequiredByDate &&
      watchedDescription?.trim() &&
      watchedJustification?.trim()
  );
  const completedLineItems = (lineItems || []).filter(
    (item) =>
      item?.itemDescription?.trim() &&
      Number(item?.quantity) > 0 &&
      item?.unitCost !== "" &&
      !Number.isNaN(Number(item?.unitCost))
  ).length;
  const lineItemsComplete =
    fields.length > 0 && completedLineItems === fields.length && !errors.lineItems;
  const readyToSubmit = requestDetailsComplete && lineItemsComplete;

  const stepStates = [
    requestDetailsComplete,
    lineItemsComplete,
    readyToSubmit,
    readyToSubmit,
  ];

  const goToPreviousStep = () => {
    setCurrentStep((current) => Math.max(0, current - 1));
  };

  const goToNextStep = async () => {
    const step = stepDefinitions[currentStep];

    if (!step) {
      return;
    }

    if (!step.fields.length) {
      setCurrentStep((current) =>
        Math.min(stepDefinitions.length - 1, current + 1)
      );
      return;
    }

    const isValid = await trigger(step.fields);

    if (isValid) {
      setCurrentStep((current) =>
        Math.min(stepDefinitions.length - 1, current + 1)
      );
      return;
    }

    if (currentStep === 2) {
      setExpandedItems(fields.map((_, index) => index));
    }
  };

  const jumpToStep = async (targetIndex) => {
    if (targetIndex <= currentStep) {
      setCurrentStep(targetIndex);
      return;
    }

    let isBlocked = false;

    for (let stepIndex = 0; stepIndex < targetIndex; stepIndex += 1) {
      const fieldsToCheck = stepDefinitions[stepIndex].fields;

      if (!fieldsToCheck.length) {
        continue;
      }

      // Validate earlier stages before allowing users to skip ahead in the
      // wizard so the review step always reflects a coherent request.
      const isValid = await trigger(fieldsToCheck);

      if (!isValid) {
        setCurrentStep(stepIndex);
        isBlocked = true;
        if (stepIndex === 2) {
          setExpandedItems(fields.map((_, index) => index));
        }
        break;
      }
    }

    if (!isBlocked) {
      setCurrentStep(targetIndex);
    }
  };

  const toggleItemExpanded = (index) => {
    setExpandedItems((current) =>
      current.includes(index)
        ? current.filter((itemIndex) => itemIndex !== index)
        : [...current, index]
    );
  };

  const handleAddLineItem = () => {
    append({ ...defaultLineItem });
    setExpandedItems((current) => [...new Set([...current, fields.length])]);
  };

  const handleRemoveLineItem = (index) => {
    remove(index);
    setExpandedItems((current) =>
      current
        .filter((itemIndex) => itemIndex !== index)
        .map((itemIndex) => (itemIndex > index ? itemIndex - 1 : itemIndex))
    );
  };

  const renderStepState = (complete, incompleteLabel = "Needs work") => {
    if (complete) {
      return <StepBadge complete label="Complete" />;
    }

    return <StepBadge label={incompleteLabel} />;
  };

  const renderSaveDraftButton = () => (
    <Button
      type="button"
      className="rounded-2xl"
      disabled={isBusy}
      onClick={handleSubmit(handleSaveDraft)}
    >
      {createRequestStatus === "loading" && submitRequestStatus !== "loading"
        ? "Saving draft..."
        : updateRequestStatus === "loading" && submitRequestStatus !== "loading"
          ? "Saving changes..."
          : isEditMode
            ? "Save Changes"
            : "Save Draft"}
    </Button>
  );

  const renderCurrentStep = () => {
    if (currentStep === 0) {
      return (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5">
                <FileText className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-100">
                    Request Details
                  </h3>
                  {renderStepState(requestDetailsComplete)}
                </div>
                <p className="mt-1 text-sm text-slate-300">
                  Add what is needed, who needs it, and why the business needs it.
                </p>
              </div>
            </div>
            {renderSaveDraftButton()}
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <InputField
              label="Request title"
              placeholder="Office chairs for finance team"
              description="Use a short name that reviewers can scan quickly."
              error={errors.title?.message}
              {...register("title")}
              className="md:col-span-2"
            />

            <SelectField
              label="Department"
              description="Choose the business team that owns this request."
              error={errors.departmentId?.message}
              disabled={activeDepartmentsStatus === "loading"}
              {...register("departmentId")}
              style={{ colorScheme: "dark" }}
            >
              <option className="bg-slate-950 text-slate-100" value="">
                {activeDepartmentsStatus === "loading"
                  ? "Loading departments..."
                  : "Select department"}
              </option>
              {activeDepartments.map((department) => (
                <option
                  key={department.id}
                  value={department.id}
                  className="bg-slate-950 text-slate-100"
                >
                  {department.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Priority"
              description="Use High or Critical only when delay affects work."
              error={errors.priority?.message}
              {...register("priority")}
              style={{ colorScheme: "dark" }}
            >
              <option className="bg-slate-950 text-slate-100" value="">
                Select priority
              </option>
              {REQUEST_PRIORITIES.map((priority) => (
                <option
                  key={priority}
                  value={priority}
                  className="bg-slate-950 text-slate-100"
                >
                  {formatPriority(priority)}
                </option>
              ))}
            </SelectField>

            <InputField
              label="Required by date"
              type="date"
              min={minimumRequiredDate}
              description="Pick the date the item or service is really needed."
              error={errors.requiredByDate?.message}
              {...register("requiredByDate")}
              className="md:col-span-2"
            />
            <TextareaField
              label="Request description"
              placeholder="Describe what needs to be procured."
              description="Describe the items or service in simple business language."
              error={errors.description?.message}
              rows={5}
              {...register("description")}
            />

            <TextareaField
              label="Business justification"
              placeholder="Explain why this request is needed."
              description="Explain the business reason and why the timing matters."
              error={errors.justification?.message}
              rows={6}
              {...register("justification")}
            />
          </div>

          {activeDepartmentsError ? (
            <div className="mt-5 rounded-[1.1rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {activeDepartmentsError}
            </div>
          ) : null}
        </Card>
      );
    }

    if (currentStep === 1) {
      return (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5">
                <ClipboardList className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-100">
                    Line Items
                  </h3>
                  {renderStepState(
                    lineItemsComplete,
                    `${completedLineItems}/${fields.length} ready`
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-300">
                  Add each item separately so reviewers can verify quantity and
                  cost quickly.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                className="gap-2 rounded-2xl"
                onClick={handleAddLineItem}
              >
                <CirclePlus className="h-4 w-4" />
                Add Line Item
              </Button>
              {renderSaveDraftButton()}
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {fields.map((field, index) => {
              const quantity = Number(lineItems?.[index]?.quantity || 0);
              const unitCost = Number(lineItems?.[index]?.unitCost || 0);
              const lineTotal = quantity * unitCost;
              const itemDescription =
                lineItems?.[index]?.itemDescription?.trim() || "New item";
              const isExpanded = expandedItems.includes(index);
              const hasItemErrors = Boolean(errors.lineItems?.[index]);

              return (
                <div
                  key={field.id}
                  className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-100">
                        Item {index + 1}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-300">
                        {itemDescription}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                        <span>Qty {quantity || 0}</span>
                        <span>{formatCurrency(lineTotal)}</span>
                        {hasItemErrors ? (
                          <span className="font-medium text-rose-300">
                            Needs attention
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-2xl px-3 py-2"
                        onClick={() => toggleItemExpanded(index)}
                      >
                        {isExpanded ? "Hide" : "Edit"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="gap-2 rounded-2xl text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                        onClick={() => handleRemoveLineItem(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="mt-4 grid gap-4 border-t border-white/8 pt-4 md:grid-cols-2">
                      <InputField
                        label="Item description"
                        placeholder="Office chair"
                        description="Example: Ergonomic office chair, HP laptop, printer toner."
                        error={errors.lineItems?.[index]?.itemDescription?.message}
                        className="md:col-span-2"
                        {...register(`lineItems.${index}.itemDescription`)}
                      />

                      <InputField
                        label="Quantity"
                        type="number"
                        min="1"
                        step="1"
                        description="How many are needed?"
                        error={errors.lineItems?.[index]?.quantity?.message}
                        {...register(`lineItems.${index}.quantity`)}
                      />

                      <InputField
                        label="Unit cost"
                        type="number"
                        min="0"
                        step="0.01"
                        description="Estimated cost for one item."
                        error={errors.lineItems?.[index]?.unitCost?.message}
                        {...register(`lineItems.${index}.unitCost`)}
                      />

                      <InputField
                        label="Unit"
                        placeholder="pieces"
                        description="Example: pieces, boxes, months, litres."
                        error={errors.lineItems?.[index]?.unit?.message}
                        {...register(`lineItems.${index}.unit`)}
                      />

                      <div className="rounded-[1.05rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                        <p className="text-sm font-medium text-slate-300">
                          Line total
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-50">
                          {formatCurrency(lineTotal)}
                        </p>
                      </div>

                      <TextareaField
                        label="Item notes"
                        placeholder="Optional notes"
                        description="Optional: add size, model, supplier, or other useful detail."
                        rows={3}
                        error={errors.lineItems?.[index]?.notes?.message}
                        className="md:col-span-2"
                        {...register(`lineItems.${index}.notes`)}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      );
    }

    if (currentStep === 2) {
      return (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-100">
                    Summary
                  </h3>
                  {renderStepState(readyToSubmit)}
                </div>
                <p className="mt-1 text-sm text-slate-300">
                  Review the request details before moving to the final submit step.
                </p>
              </div>
            </div>
            {renderSaveDraftButton()}
          </div>

          <div className="mt-6 grid gap-6">
            <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-5 py-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                Request Summary
              </h4>
              <div className="mt-4">
                <ReviewRow label="Title" value={watchedTitle || "Not set"} />
                <ReviewRow
                  label="Department"
                  value={selectedDepartment?.name || "Not set"}
                />
                <ReviewRow
                  label="Priority"
                  value={formatPriority(watchedPriority)}
                />
                <ReviewRow
                  label="Required By"
                  value={watchedRequiredByDate || "Not set"}
                />
              </div>
            </div>

            <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-5 py-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                Description
              </h4>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {watchedDescription?.trim() || "No description provided."}
              </p>
            </div>

            <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-5 py-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                Justification
              </h4>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {watchedJustification?.trim() || "No justification provided."}
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.3rem] border border-white/8 bg-white/[0.03]">
              <div className="border-b border-white/8 px-5 py-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Line Items
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/8 text-sm">
                  <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Item</th>
                      <th className="px-4 py-3 font-semibold">Qty</th>
                      <th className="px-4 py-3 font-semibold">Unit Cost</th>
                      <th className="px-4 py-3 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {(lineItems || []).map((item, index) => (
                      <tr key={`${item?.itemDescription}-${index}`} className="align-top">
                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-100">
                            {item?.itemDescription || `Item ${index + 1}`}
                          </p>
                          {item?.notes ? (
                            <p className="mt-2 text-xs leading-6 text-slate-400">
                              {item.notes}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {item?.quantity || 0}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {formatCurrency(item?.unitCost)}
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-100">
                          {formatCurrency(
                            Number(item?.quantity || 0) * Number(item?.unitCost || 0)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-100">
                  Review & Submit
                </h3>
                {renderStepState(readyToSubmit)}
              </div>
              <p className="mt-1 text-sm text-slate-300">
                Review the request before moving to the final submit step.
              </p>
            </div>
          </div>
          {renderSaveDraftButton()}
        </div>

        <div className="mt-6 grid gap-6">
          <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-5 py-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Request Summary
            </h4>
            <div className="mt-4">
              <ReviewRow label="Title" value={watchedTitle || "Not set"} />
              <ReviewRow
                label="Department"
                value={selectedDepartment?.name || "Not set"}
              />
              <ReviewRow
                label="Priority"
                value={formatPriority(watchedPriority)}
              />
              <ReviewRow
                label="Required By"
                value={watchedRequiredByDate || "Not set"}
              />
            </div>
          </div>

          <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-5 py-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Description
            </h4>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {watchedDescription?.trim() || "No description provided."}
            </p>
          </div>

          <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-5 py-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Justification
            </h4>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {watchedJustification?.trim() || "No justification provided."}
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.3rem] border border-white/8 bg-white/[0.03]">
            <div className="border-b border-white/8 px-5 py-4">
              <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                Line Items
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/8 text-sm">
                <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Item</th>
                    <th className="px-4 py-3 font-semibold">Qty</th>
                    <th className="px-4 py-3 font-semibold">Unit Cost</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {(lineItems || []).map((item, index) => (
                    <tr key={`${item?.itemDescription}-${index}`} className="align-top">
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-100">
                          {item?.itemDescription || `Item ${index + 1}`}
                        </p>
                        {item?.notes ? (
                          <p className="mt-2 text-xs leading-6 text-slate-400">
                            {item.notes}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {item?.quantity || 0}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {formatCurrency(item?.unitCost)}
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-100">
                        {formatCurrency(
                          Number(item?.quantity || 0) * Number(item?.unitCost || 0)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
    );

    if (currentStep === 4) {
      return (
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-100">
                  Submit Request
                </h3>
                {renderStepState(readyToSubmit)}
              </div>
              <p className="mt-1 text-sm text-slate-300">
                This is the final step. Submit when you are satisfied with the request.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[1.3rem] border border-emerald-400/15 bg-emerald-500/10 px-5 py-5">
              <p className="text-sm font-medium text-emerald-100/85">
                Estimated total
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-50">
                {formatCurrency(estimatedTotal)}
              </p>
            </div>

            <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-5 py-5">
              <p className="text-sm font-medium text-slate-100">What happens next</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Once submitted, the request moves to Admin review. You can still save
                it as a draft if you want to come back later.
              </p>
            </div>

            <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-5 py-5">
              <p className="text-sm font-medium text-slate-100">Final check</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-300">Request Details</span>
                  {renderStepState(requestDetailsComplete)}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-300">Line Items</span>
                  {renderStepState(
                    lineItemsComplete,
                    `${completedLineItems}/${fields.length} ready`
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-action-bar">
        <div className="page-action-copy">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="ghost" className="h-10 rounded-2xl px-3">
              <Link to={isEditMode && requestId ? `/requests/${requestId}` : "/requests"}>
                <ArrowLeft className="h-4 w-4" />
                <span>{isEditMode ? "Back to Request" : "Back to My Requests"}</span>
              </Link>
            </Button>
          </div>
          <p className="section-title mt-4">Request Workspace</p>
          <h2 className="page-action-title">
            {isEditMode ? "Edit Request" : "Create Request"}
          </h2>
          <p className="page-action-subtitle">
            {isEditMode
              ? "Work through each stage, confirm the request, then send it back when it is ready."
              : "Move step by step through the request so the procurement details stay clear and easy to review."}
          </p>
        </div>
      </div>

      {isEditMode && requestDetailsStatus === "loading" && !requestDetails ? (
        <Card>
          <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-10 text-sm text-slate-400">
            Loading request for editing...
          </div>
        </Card>
      ) : null}

      <form className="mx-auto max-w-5xl space-y-6">
          {renderCurrentStep()}

          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Step {currentStep + 1} of {stepDefinitions.length}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-100">
                    {stepDefinitions[currentStep].title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/8 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2 rounded-2xl"
                  disabled={currentStep === 0}
                  onClick={goToPreviousStep}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>

                {currentStep < stepDefinitions.length - 1 ? (
                  <Button
                    type="button"
                    className="gap-2 rounded-2xl"
                    onClick={goToNextStep}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-2xl"
                    disabled={isBusy || !readyToSubmit}
                    onClick={handleSubmit(handleSaveAndSubmit)}
                  >
                    {submitRequestStatus === "loading"
                      ? "Submitting request..."
                      : isEditMode
                        ? "Save & Resubmit"
                        : "Save & Submit"}
                  </Button>
                )}
              </div>
            </div>

            {!readyToSubmit ? (
              <p className="text-xs text-amber-200">
                Complete each step before submitting the request.
              </p>
            ) : null}

            {(createRequestError || submitRequestError) && !Object.keys(errors).length ? (
              <div className="rounded-[1.1rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {submitRequestError || updateRequestError || createRequestError}
              </div>
            ) : null}
          </Card>
      </form>
    </div>
  );
}

export default CreateRequestPage;
