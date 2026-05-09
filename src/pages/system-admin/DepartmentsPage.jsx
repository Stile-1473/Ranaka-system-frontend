import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import InputField from "../../components/forms/InputField";
import TextareaField from "../../components/forms/TextareaField";
import Modal from "../../components/ui/Modal";
import StatCard from "../../components/dashboard/StatCard";
import { useDepartmentMutationStore } from "../../stores/mutation/departmentMutationStore";
import { useDepartmentQueryStore } from "../../stores/query/departmentQueryStore";
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

  const filtersActive =
    searchTerm.trim().length > 0 || statusFilter !== "ALL";

  const refreshDepartments = async () => {
    await Promise.all([fetchDepartments(), fetchActiveDepartments()]);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
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
      <div className="page-action-bar">
        <div className="page-action-copy">
          <p className="section-title">Master Data</p>
          <h2 className="page-action-title">Department Management</h2>
          <p className="page-action-subtitle">
            Maintain the department structure used for routing, reporting, and request ownership across the platform.
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        <StatCard
          label="Filtered"
          value={filteredDepartments.length}
          helper="Results matching the current filters"
        />
      </div>

      <Card className="p-0">
        <div className="table-shell rounded-none border-0 bg-transparent shadow-none">
          <div className="border-b border-white/8 px-4 py-3 lg:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative block min-w-[16rem] flex-[1.7]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, code, or description..."
                  className="glass-control h-10 w-full rounded-full py-2 pl-11 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>

              <div className="relative min-w-[11rem] flex-1">
                <select
                  aria-label="Filter department status"
                  className="glass-control h-10 w-full appearance-none rounded-full px-4 pr-10 text-sm text-slate-100 outline-none transition focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
                  style={{ colorScheme: "dark" }}
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option className="bg-slate-950 text-slate-100" value="ALL">
                    All departments
                  </option>
                  <option className="bg-slate-950 text-slate-100" value="ACTIVE">
                    Active only
                  </option>
                  <option className="bg-slate-950 text-slate-100" value="INACTIVE">
                    Inactive only
                  </option>
                </select>
                <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="ml-auto flex items-center gap-2">
                <span className="hidden rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-slate-400 2xl:inline-flex">
                  {filteredDepartments.length} results
                </span>
                {filtersActive ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="h-10 rounded-full border border-white/10 bg-white/6 px-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-slate-50"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="px-4 py-4 lg:px-6">
            {departmentsStatus === "loading" ? (
              <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-10 text-sm text-slate-400">
                Loading departments...
              </div>
            ) : departmentsError ? (
              <div className="rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 px-4 py-10 text-sm text-rose-200">
                {departmentsError}
              </div>
            ) : filteredDepartments.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-sm text-slate-400">
                No departments matched the current filters.
              </div>
            ) : (
              <div className="overflow-hidden rounded-[1.25rem] border border-white/8 bg-slate-950/30">
                <div className="table-header-row hidden grid-cols-[1fr_0.7fr_1.4fr_0.7fr_0.9fr] gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] lg:grid">
                  <span>Department</span>
                  <span>Code</span>
                  <span>Description</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>

                <div className="divide-y divide-white/8">
                  {filteredDepartments.map((department) => (
                    <div
                      key={department.id}
                      className="table-data-row px-4 py-4 transition"
                    >
                      <div className="space-y-4 lg:hidden">
                        <div>
                          <p className="text-sm font-semibold text-slate-50">
                            {department.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Updated {formatDateTime(department.updatedAt)}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Code
                            </p>
                            <p className="mt-1 text-slate-200">
                              {department.code || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Status
                            </p>
                            <div className="mt-1">
                              <Badge
                                variant={department.isActive ? "success" : "neutral"}
                              >
                                {department.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Description
                            </p>
                            <p className="mt-1 text-slate-200">
                              {department.description || "No description provided."}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
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
                              className="px-3 py-2 text-rose-300 hover:text-rose-200"
                              onClick={() => toggleDepartmentStatus(department)}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              className="px-3 py-2 text-emerald-300 hover:text-emerald-200"
                              onClick={() => toggleDepartmentStatus(department)}
                            >
                              Activate
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            className="gap-2 px-3 py-2 text-rose-300 hover:text-rose-200"
                            onClick={() => handleDelete(department)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      <div className="hidden lg:grid lg:grid-cols-[1fr_0.7fr_1.4fr_0.7fr_0.9fr] lg:items-center lg:gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-50">
                            {department.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Updated {formatDateTime(department.updatedAt)}
                          </p>
                        </div>

                        <div className="text-sm text-slate-300">
                          {department.code || "Not set"}
                        </div>

                        <div className="text-sm text-slate-300">
                          {department.description || "No description provided."}
                        </div>

                        <div>
                          <Badge
                            variant={department.isActive ? "success" : "neutral"}
                          >
                            {department.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
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
                              className="px-3 py-2 text-rose-300 hover:text-rose-200"
                              onClick={() => toggleDepartmentStatus(department)}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              className="px-3 py-2 text-emerald-300 hover:text-emerald-200"
                              onClick={() => toggleDepartmentStatus(department)}
                            >
                              Activate
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            className="gap-2 px-3 py-2 text-rose-300 hover:text-rose-200"
                            onClick={() => handleDelete(department)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
