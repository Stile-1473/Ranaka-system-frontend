import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, CirclePlus, Trash2 } from "lucide-react";
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
  lineItems: z
    .array(lineItemSchema)
    .min(1, "At least one line item is required"),
});

const defaultLineItem = {
  itemDescription: "",
  quantity: 1,
  unitCost: 0,
  unit: "",
  notes: "",
};

const normalizeFieldPath = (path) => path.replace(/\[(\d+)\]/g, ".$1");

function CreateRequestPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(requestId);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState([]);
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

  // useWatch gives us reliable live updates for nested form values like
  // lineItems, which is important for totals and compact summary chips.
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

    setExpandedItems([]);
    setIsDetailsExpanded(false);
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

  useEffect(() => {
    if (
      errors.title ||
      errors.description ||
      errors.departmentId ||
      errors.justification ||
      errors.priority ||
      errors.requiredByDate
    ) {
      setIsDetailsExpanded(true);
    }
  }, [
    errors.departmentId,
    errors.description,
    errors.justification,
    errors.priority,
    errors.requiredByDate,
    errors.title,
  ]);

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
            createRequestError || "Please review the highlighted request fields.",
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
  const hasDetailsErrors = Boolean(
    errors.title ||
      errors.description ||
      errors.departmentId ||
      errors.justification ||
      errors.priority ||
      errors.requiredByDate
  );
  const requestDetailsComplete = Boolean(
    watchedTitle?.trim() &&
      watchedDescription?.trim() &&
      watchedJustification?.trim() &&
      selectedDepartment &&
      watchedPriority &&
      watchedRequiredByDate
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

  const renderSectionState = (isComplete, incompleteLabel = "Needs work") => {
    if (isComplete) {
      return (
        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          Complete
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        {incompleteLabel}
      </span>
    );
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {isEditMode ? "Edit Request" : "Create Request"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isEditMode
              ? "Update the request and save it when you are ready."
              : "Capture the request details and submit when the form is complete."}
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link to={isEditMode && requestId ? `/requests/${requestId}` : "/requests"}>
            {isEditMode ? "Back to Request" : "Back to My Requests"}
          </Link>
        </Button>
      </div>

      {isEditMode && requestDetailsStatus === "loading" && !requestDetails ? (
        <Card>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-sm text-slate-500">
            Loading request for editing...
          </div>
        </Card>
      ) : null}

      <form className="grid gap-6 xl:grid-cols-[1.65fr_0.85fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Request Details
                  </h3>
                  {renderSectionState(requestDetailsComplete)}
                </div>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {watchedTitle?.trim() || "New request"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>{selectedDepartment?.name || "No department selected"}</span>
                  <span>{formatPriority(watchedPriority)}</span>
                  <span>{watchedRequiredByDate || "No date selected"}</span>
                  {hasDetailsErrors ? (
                    <span className="font-medium text-rose-700">
                      Needs attention
                    </span>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="gap-2 px-3 py-2"
                onClick={() => setIsDetailsExpanded((current) => !current)}
              >
                <span>{isDetailsExpanded ? "Collapse" : "Expand"}</span>
                <ChevronDown
                  className={`h-4 w-4 transition ${isDetailsExpanded ? "rotate-180" : ""}`}
                />
              </Button>
            </div>

            {isDetailsExpanded ? (
              <div className="mt-4 grid gap-5 border-t border-slate-200 pt-4 md:grid-cols-2">
                <InputField
                  label="Request title"
                  placeholder="Office chairs for finance team"
                  error={errors.title?.message}
                  {...register("title")}
                  className="md:col-span-2"
                />

                <SelectField
                  label="Department"
                  error={errors.departmentId?.message}
                  disabled={activeDepartmentsStatus === "loading"}
                  {...register("departmentId")}
                >
                  <option value="">
                    {activeDepartmentsStatus === "loading"
                      ? "Loading departments..."
                      : "Select department"}
                  </option>
                  {activeDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </SelectField>

                <SelectField
                  label="Priority"
                  error={errors.priority?.message}
                  {...register("priority")}
                >
                  <option value="">Select priority</option>
                  {REQUEST_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {formatPriority(priority)}
                    </option>
                  ))}
                </SelectField>

                <InputField
                  label="Required by date"
                  type="date"
                  min={minimumRequiredDate}
                  error={errors.requiredByDate?.message}
                  {...register("requiredByDate")}
                />

                <TextareaField
                  label="Request description"
                  placeholder="Describe what needs to be procured."
                  error={errors.description?.message}
                  rows={4}
                  className="md:col-span-2"
                  {...register("description")}
                />

                <TextareaField
                  label="Business justification"
                  placeholder="Explain why this request is needed."
                  error={errors.justification?.message}
                  rows={4}
                  className="md:col-span-2"
                  {...register("justification")}
                />
              </div>
            ) : null}

            {activeDepartmentsError ? (
              <div className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {activeDepartmentsError}
              </div>
            ) : null}
          </Card>

          <Card>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Line Items
                  </h3>
                  {renderSectionState(
                    lineItemsComplete,
                    `${completedLineItems}/${fields.length} ready`
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={handleAddLineItem}
              >
                <CirclePlus className="h-4 w-4" />
                Add Line Item
              </Button>
            </div>

            <div className="space-y-5">
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
                    className="rounded-lg border border-slate-200 bg-white px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          Item {index + 1}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {itemDescription}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>Qty {quantity || 0}</span>
                          <span>{formatCurrency(lineTotal)}</span>
                          {hasItemErrors ? (
                            <span className="font-medium text-rose-700">
                              Needs attention
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
                      <Button
                        type="button"
                        variant="ghost"
                        className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => handleRemoveLineItem(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Remove</span>
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">
                        <InputField
                          label="Item description"
                          placeholder="Office chair"
                          error={errors.lineItems?.[index]?.itemDescription?.message}
                          className="md:col-span-2"
                          {...register(`lineItems.${index}.itemDescription`)}
                        />

                        <InputField
                          label="Quantity"
                          type="number"
                          min="1"
                          step="1"
                          error={errors.lineItems?.[index]?.quantity?.message}
                          {...register(`lineItems.${index}.quantity`)}
                        />

                        <InputField
                          label="Unit cost"
                          type="number"
                          min="0"
                          step="0.01"
                          error={errors.lineItems?.[index]?.unitCost?.message}
                          {...register(`lineItems.${index}.unitCost`)}
                        />

                        <InputField
                          label="Unit"
                          placeholder="pieces"
                          error={errors.lineItems?.[index]?.unit?.message}
                          {...register(`lineItems.${index}.unit`)}
                        />

                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-sm font-medium text-slate-600">
                            Line total
                          </p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">
                            {formatCurrency(lineTotal)}
                          </p>
                        </div>

                        <TextareaField
                          label="Item notes"
                          placeholder="Optional notes"
                          rows={2}
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
        </div>

        <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Summary</h3>

            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-medium text-slate-500">Estimated total</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {formatCurrency(estimatedTotal)}
                </p>
              </div>

              <div className="space-y-3 rounded-lg border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">Line items</span>
                  <span className="font-medium text-slate-900">{fields.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">Priority</span>
                  <span className="font-medium text-slate-900">
                    {formatPriority(watchedPriority)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">Required by</span>
                  <span className="font-medium text-slate-900">
                    {watchedRequiredByDate || "Not set"}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-medium text-slate-500">Form status</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-700">
                      Request Details
                    </span>
                    {renderSectionState(requestDetailsComplete)}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-700">
                      Line Items
                    </span>
                    {renderSectionState(
                      lineItemsComplete,
                      `${completedLineItems}/${fields.length} ready`
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Actions</h3>

            <div className="mt-5 space-y-3">
              <Button
                type="button"
                className="w-full"
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

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={isBusy || !readyToSubmit}
                onClick={handleSubmit(handleSaveAndSubmit)}
              >
                {submitRequestStatus === "loading"
                  ? "Submitting request..."
                  : isEditMode
                    ? "Save & Resubmit"
                    : "Save & Submit"}
              </Button>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              {isEditMode
                ? "Save Changes keeps the request editable. Save & Resubmit sends it back into workflow."
                : "Save Draft keeps the request editable. Save & Submit sends it into workflow."}
            </p>

            {!readyToSubmit ? (
              <p className="mt-2 text-sm text-amber-700">
                Complete Request Details and Line Items before submitting.
              </p>
            ) : null}

            {(createRequestError || submitRequestError) && !Object.keys(errors).length ? (
              <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {submitRequestError || updateRequestError || createRequestError}
              </div>
            ) : null}
          </Card>
        </div>
      </form>
    </div>
  );
}

export default CreateRequestPage;
