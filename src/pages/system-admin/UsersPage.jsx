import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import InputField from "../../components/forms/InputField";
import SelectField from "../../components/forms/SelectField";
import Modal from "../../components/ui/Modal";
import StatCard from "../../components/dashboard/StatCard";
import { USER_ROLES } from "../../config/constants";
import { useUserMutationStore } from "../../stores/mutation/userMutationStore";
import { useUserQueryStore } from "../../stores/query/userQueryStore";

const USER_ROLE_OPTIONS = Object.values(USER_ROLES);

const createEmptyForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: USER_ROLES.REQUESTER,
});

function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formValues, setFormValues] = useState(createEmptyForm());

  const usersPage = useUserQueryStore((state) => state.usersPage);
  const usersPageStatus = useUserQueryStore((state) => state.usersPageStatus);
  const usersPageError = useUserQueryStore((state) => state.usersPageError);
  const fetchUsersPage = useUserQueryStore((state) => state.fetchUsersPage);

  const createSystemUser = useUserMutationStore((state) => state.createSystemUser);
  const createUserStatus = useUserMutationStore((state) => state.createUserStatus);
  const updateSystemUser = useUserMutationStore((state) => state.updateSystemUser);
  const updateUserStatus = useUserMutationStore((state) => state.updateUserStatus);
  const activateSystemUser = useUserMutationStore(
    (state) => state.activateSystemUser
  );
  const deactivateSystemUser = useUserMutationStore(
    (state) => state.deactivateSystemUser
  );

  useEffect(() => {
    fetchUsersPage({ page: currentPage, size: 12, sort: "id,desc" });
  }, [currentPage, fetchUsersPage]);

  const users = usersPage?.content ?? [];

  const activeUsers = useMemo(
    () => users.filter((user) => user.isActive),
    [users]
  );

  const inactiveUsers = useMemo(
    () => users.filter((user) => !user.isActive),
    [users]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && user.isActive) ||
        (statusFilter === "INACTIVE" && !user.isActive);
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);

      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [roleFilter, searchTerm, statusFilter, users]);

  const filtersActive =
    searchTerm.trim().length > 0 ||
    roleFilter !== "ALL" ||
    statusFilter !== "ALL";

  const openCreateModal = () => {
    setEditingUser(null);
    setFormValues(createEmptyForm());
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormValues({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      password: "",
      role: user.role || USER_ROLES.REQUESTER,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingUser(null);
    setFormValues(createEmptyForm());
    setIsModalOpen(false);
  };

  const refreshUsers = () =>
    fetchUsersPage({ page: currentPage, size: 12, sort: "id,desc" });

  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      email: formValues.email.trim(),
      phoneNumber: formValues.phoneNumber.trim(),
      role: formValues.role,
    };

    try {
      if (editingUser) {
        await updateSystemUser({
          userId: editingUser.id,
          payload,
        });
        toast.success("User updated");
      } else {
        await createSystemUser({
          ...payload,
          password: formValues.password,
        });
        toast.success("User created");
      }

      closeModal();
      setCurrentPage(0);
      await fetchUsersPage({ page: 0, size: 12, sort: "id,desc" });
    } catch (error) {
      toast.error(editingUser ? "Could not update user" : "Could not create user", {
        description:
          error?.response?.data?.message || "Please review the details and try again.",
      });
    }
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.isActive) {
        await deactivateSystemUser(user.id);
        toast.success("User deactivated");
      } else {
        await activateSystemUser(user.id);
        toast.success("User activated");
      }

      await refreshUsers();
    } catch (error) {
      toast.error("Could not update user status", {
        description:
          error?.response?.data?.message || "Please try the action again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-action-bar">
        <div className="page-action-copy">
          <p className="section-title">System Access</p>
          <h2 className="page-action-title">User Management</h2>
          <p className="page-action-subtitle">
            Control role access, account status, and platform identity from one operational workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" className="gap-2" onClick={refreshUsers}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="gap-2" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Create User
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Loaded"
          value={users.length}
          helper="Users currently loaded in this view"
        />
        <StatCard
          label="Active"
          value={activeUsers.length}
          helper="Accounts currently able to sign in"
        />
        <StatCard
          label="Inactive"
          value={inactiveUsers.length}
          tone="amber"
          helper="Accounts currently disabled"
        />
        <StatCard
          label="Filtered"
          value={filteredUsers.length}
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
                  placeholder="Search by name or email..."
                  className="glass-control h-10 w-full rounded-full py-2 pl-11 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>

              <div className="relative min-w-[11rem] flex-1">
                <select
                  aria-label="Filter role"
                  className="glass-control h-10 w-full appearance-none rounded-full px-4 pr-10 text-sm text-slate-100 outline-none transition focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
                  style={{ colorScheme: "dark" }}
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                >
                  <option className="bg-slate-950 text-slate-100" value="ALL">
                    All roles
                  </option>
                  {USER_ROLE_OPTIONS.map((role) => (
                    <option
                      key={role}
                      className="bg-slate-950 text-slate-100"
                      value={role}
                    >
                      {role.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="relative min-w-[11rem] flex-1">
                <select
                  aria-label="Filter status"
                  className="glass-control h-10 w-full appearance-none rounded-full px-4 pr-10 text-sm text-slate-100 outline-none transition focus:border-emerald-400/35 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10"
                  style={{ colorScheme: "dark" }}
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option className="bg-slate-950 text-slate-100" value="ALL">
                    All users
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
                  {filteredUsers.length} results
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
            {usersPageStatus === "loading" ? (
              <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-10 text-sm text-slate-400">
                Loading users...
              </div>
            ) : usersPageError ? (
              <div className="rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 px-4 py-10 text-sm text-rose-200">
                {usersPageError}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-sm text-slate-400">
                No users matched the current filters.
              </div>
            ) : (
              <div className="overflow-hidden rounded-[1.25rem] border border-white/8 bg-slate-950/30">
                <div className="table-header-row hidden grid-cols-[1.2fr_1.2fr_0.8fr_0.7fr_1fr] gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] lg:grid">
                  <span>User</span>
                  <span>Contact</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>

                <div className="divide-y divide-white/8">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="table-data-row px-4 py-4 transition"
                    >
                      <div className="space-y-4 lg:hidden">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-50">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">ID #{user.id}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Email
                            </p>
                            <p className="mt-1 text-slate-200">{user.email}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Phone
                            </p>
                            <p className="mt-1 text-slate-200">{user.phoneNumber}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Role
                            </p>
                            <p className="mt-1 text-slate-200">
                              {user.role?.replaceAll("_", " ")}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Status
                            </p>
                            <div className="mt-1">
                              <Badge variant={user.isActive ? "success" : "neutral"}>
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            className="px-3 py-2"
                            onClick={() => openEditModal(user)}
                          >
                            Edit
                          </Button>
                          {user.isActive ? (
                            <Button
                              variant="secondary"
                              className="gap-2 px-3 py-2 text-rose-300 hover:text-rose-200"
                              onClick={() => handleToggleActive(user)}
                            >
                              <UserX className="h-4 w-4" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              className="gap-2 px-3 py-2 text-emerald-300 hover:text-emerald-200"
                              onClick={() => handleToggleActive(user)}
                            >
                              <UserCheck className="h-4 w-4" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="hidden lg:grid lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.7fr_1fr] lg:items-center lg:gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-50">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">ID #{user.id}</p>
                        </div>

                        <div className="text-sm text-slate-300">
                          <div>{user.email}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {user.phoneNumber}
                          </div>
                        </div>

                        <div className="text-sm text-slate-300">
                          {user.role?.replaceAll("_", " ")}
                        </div>

                        <div>
                          <Badge variant={user.isActive ? "success" : "neutral"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            variant="secondary"
                            className="px-3 py-2"
                            onClick={() => openEditModal(user)}
                          >
                            Edit
                          </Button>
                          {user.isActive ? (
                            <Button
                              variant="secondary"
                              className="gap-2 px-3 py-2 text-rose-300 hover:text-rose-200"
                              onClick={() => handleToggleActive(user)}
                            >
                              <UserX className="h-4 w-4" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              className="gap-2 px-3 py-2 text-emerald-300 hover:text-emerald-200"
                              onClick={() => handleToggleActive(user)}
                            >
                              <UserCheck className="h-4 w-4" />
                              Activate
                            </Button>
                          )}
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

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          Page {Number(usersPage?.page ?? 0) + 1} of{" "}
          {Math.max(Number(usersPage?.totalPages ?? 0), 1)}
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            disabled={(usersPage?.page ?? 0) <= 0}
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 0))}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            disabled={(usersPage?.page ?? 0) >= (usersPage?.totalPages ?? 1) - 1}
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(page + 1, Math.max((usersPage?.totalPages ?? 1) - 1, 0))
              )
            }
          >
            Next
          </Button>
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingUser ? "Edit User" : "Create User"}
        description="Keep account details and role access accurate."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="First name"
              value={formValues.firstName}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  firstName: event.target.value,
                }))
              }
              required
            />
            <InputField
              label="Last name"
              value={formValues.lastName}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  lastName: event.target.value,
                }))
              }
              required
            />
          </div>

          <InputField
            label="Email"
            type="email"
            value={formValues.email}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            required
          />

          <InputField
            label="Phone number"
            value={formValues.phoneNumber}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                phoneNumber: event.target.value,
              }))
            }
            required
          />

          {!editingUser ? (
            <InputField
              label="Temporary password"
              type="password"
              value={formValues.password}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              required
            />
          ) : null}

          <SelectField
            label="Role"
            value={formValues.role}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                role: event.target.value,
              }))
            }
          >
            {USER_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role.replaceAll("_", " ")}
              </option>
            ))}
          </SelectField>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={
                createUserStatus === "loading" || updateUserStatus === "loading"
              }
            >
              {createUserStatus === "loading" || updateUserStatus === "loading"
                ? "Saving..."
                : editingUser
                  ? "Save Changes"
                  : "Create User"}
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

export default UsersPage;
