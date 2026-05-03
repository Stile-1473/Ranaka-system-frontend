import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import InputField from "../../components/forms/InputField";
import TextareaField from "../../components/forms/TextareaField";
import SelectField from "../../components/forms/SelectField";
import Modal from "../../components/ui/Modal";
import StatCard from "../../components/dashboard/StatCard";
import { useDepartmentQueryStore } from "../../stores/query/departmentQueryStore";
import { useDepartmentMutationStore } from "../../stores/mutation/departmentMutationStore";
import { formatDateTime } from "../../utils/dateFormatters";

const createEmptyForm = () => ({
  name: "",
  description: "",
});

function DepartmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formValues, setFormValues] = useState(createEmptyForm());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const departments = useDepartmentQueryStore((state) => state.departments);
  const departmentsStatus = useDepartmentQueryStore((state) => state.departmentsStatus);
  const departmentsError = useDepartmentQueryStore((state) => state.departmentsError);
  const fetchDepartments = useDepartmentQueryStore((state) => state.fetchDepartments);
  const fetchActiveDepartments = useDepartmentQueryStore(
    (state) => state.fetchActiveDepartments
  );

  const createSystemDepartment = useDepartmentMutationStore(
    (state) => state.createSystemDepartment
  );
  const createDepartmentStatus = useDepartmentMutationStore(
    (state) => state.createDepartmentStatus
  );
  const updateSystemDepartment = useDepartmentMutationStore(
    (state) => state.updateSystemDepartment
  );
  const updateDepartmentStatus = useDepartmentMutationStore(
    (state) => state.updateDepartmentStatus
  );
  const deleteSystemDepartment = useDepartmentMutationStore(
    (state) => state.deleteSystemDepartment
  );

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const activeDepartments = useMemo(
    () => (departments || []).filter((department) => department.isActive),
    [departments]
  );

  const inactiveDepartments = useMemo(
    () => (departments || []).filter((department) => !department.isActive),
    [departments]
  );

  const filteredDepartments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return (departments || []).filter((department) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && department.isActive) ||
        (statusFilter === "INACTIVE" && !department.isActive);

      const matchesSearch =
        !search ||
        department.name?.toLowerCase().includes(search) ||
        department.code?.toLowerCase().includes(search) ||
        department.description?.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [departments, searchTerm, statusFilter]);

  const refreshDepartments = async () => {
    await Promise.all([fetchDepartments(), fetchActiveDepartments()]);
  };

  const openCreateModal = () => {
    setEditingDepartment(null);
    setFormValues(createEmptyForm());
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingDepartment(null);
    setFormValues(createEmptyForm());
    setIsModalOpen(false);
  };

  const openEditModal = (department) => {
    setEditingDepartment(department);
    setFormValues({
      name: department.name || "",
      description: department.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingDepartment) {
        await updateSystemDepartment({
          departmentId: editingDepartment.id,
          payload: {
            name: formValues.name.trim(),
            description: formValues.description.trim(),
            isActive: editingDepartment.isActive,
          },
        });
        toast.success("Department updated");
      } else {
        await createSystemDepartment({
          name: formValues.name.trim(),
          description: formValues.description.trim(),
        });
        toast.success("Department created");
      }

      closeModal();
      await refreshDepartments();
    } catch (error) {
      toast.error(
        editingDepartment ? "Could not update department" : "Could not create department",
        {
          description:
            error?.response?.data?.message || "Please review the details and try again.",
        }
      );
    }
  };

  const toggleDepartmentStatus = async (department) => {
    try {
      await updateSystemDepartment({
        departmentId: department.id,
        payload: {
          name: department.name,
          description: department.description,
          isActive: !department.isActive,
        },
      });

      toast.success(
        department.isActive ? "Department deactivated" : "Department activated"
      );
      await refreshDepartments();
    } catch (error) {
      toast.error("Could not update department", {
        description:
          error?.response?.data?.message || "Please try the action again.",
      });
    }
  };

  const handleDelete = async (department) => {
    if (!window.confirm(`Delete ${department.name}? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteSystemDepartment(department.id);
      toast.success("Department deleted");
      await refreshDepartments();
      if (editingDepartment?.id === department.id) {
        closeModal();
      }
    } catch (error) {
      toast.error("Could not delete department", {
        description:
          error?.response?.data?.message || "The department may still be in use.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Department Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Maintain a clean department structure for routing, ownership, and reporting.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" className="gap-2" onClick={refreshDepartments}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="gap-2" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Create Department
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total"
          value={departments?.length ?? 0}
          helper="Departments currently loaded"
        />
        <StatCard
          label="Active"
          value={activeDepartments.length}
          helper="Departments available for new requests"
        />
        <StatCard
          label="Inactive"
          value={inactiveDepartments.length}
          tone="amber"
          helper="Departments currently disabled"
        />
      </div>

      <Card>
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <InputField
            label="Search"
            placeholder="Search by name, code, or description"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <SelectField
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All departments</option>
            <option value="ACTIVE">Active only</option>
            <option value="INACTIVE">Inactive only</option>
          </SelectField>
        </div>

        <div className="mt-6">
          {departmentsStatus === "loading" ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-sm text-slate-500">
              Loading departments...
            </div>
          ) : departmentsError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-10 text-sm text-rose-700">
              {departmentsError}
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-500">
              No departments matched the current filters.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="hidden grid-cols-[1fr_0.7fr_1.4fr_0.7fr_0.9fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:grid">
                <span>Department</span>
                <span>Code</span>
                <span>Description</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="divide-y divide-slate-200">
                {filteredDepartments.map((department) => (
                  <div
                    key={department.id}
                    className="grid gap-4 px-4 py-4 lg:grid-cols-[1fr_0.7fr_1.4fr_0.7fr_0.9fr] lg:items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {department.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Updated {formatDateTime(department.updatedAt)}
                      </p>
                    </div>

                    <div className="text-sm text-slate-600">
                      {department.code || "Not set"}
                    </div>

                    <div className="text-sm text-slate-600">
                      {department.description || "No description provided."}
                    </div>

                    <div>
                      <Badge
                        variant={department.isActive ? "success" : "neutral"}
                      >
                        {department.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                      <Button
                        variant="secondary"
                        className="px-3 py-2"
                        onClick={() => openEditModal(department)}
                      >
                        Edit
                      </Button>

                      {department.isActive ? (
                        <Button
                          variant="secondary"
                          className="px-3 py-2 text-rose-700 hover:border-rose-200 hover:text-rose-800"
                          onClick={() => toggleDepartmentStatus(department)}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          className="px-3 py-2 text-emerald-700 hover:border-emerald-200 hover:text-emerald-800"
                          onClick={() => toggleDepartmentStatus(department)}
                        >
                          Activate
                        </Button>
                      )}

                      <Button
                        variant="secondary"
                        className="gap-2 px-3 py-2 text-rose-700 hover:border-rose-200 hover:text-rose-800"
                        onClick={() => handleDelete(department)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingDepartment ? "Edit Department" : "Create Department"}
        description="Keep department details clean for request assignment and reporting."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <InputField
            label="Department name"
            value={formValues.name}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            required
          />

          <TextareaField
            label="Description"
            rows={5}
            value={formValues.description}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={
                createDepartmentStatus === "loading" ||
                updateDepartmentStatus === "loading"
              }
            >
              {createDepartmentStatus === "loading" ||
              updateDepartmentStatus === "loading"
                ? "Saving..."
                : editingDepartment
                  ? "Save Changes"
                  : "Create Department"}
            </Button>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DepartmentsPage;
