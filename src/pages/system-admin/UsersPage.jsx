import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCcw, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import InputField from "../../components/forms/InputField";
import SelectField from "../../components/forms/SelectField";
import Modal from "../../components/ui/Modal";
import StatCard from "../../components/dashboard/StatCard";
import { USER_ROLES } from "../../config/constants";
import { useUserQueryStore } from "../../stores/query/userQueryStore";
import { useUserMutationStore } from "../../stores/mutation/userMutationStore";

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            User Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage access, role assignment, and account status from one clean workspace.
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

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="On Page"
          value={users.length}
          helper="Users currently loaded in this view"
        />
        <StatCard
          label="Active"
          value={activeUsers.length}
          helper="Accounts ready to sign in"
        />
        <StatCard
          label="Inactive"
          value={inactiveUsers.length}
          tone="amber"
          helper="Accounts currently disabled"
        />
      </div>

      <Card>
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.8fr_0.8fr]">
          <InputField
            label="Search"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <SelectField
            label="Role"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="ALL">All roles</option>
            {USER_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role.replaceAll("_", " ")}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All users</option>
            <option value="ACTIVE">Active only</option>
            <option value="INACTIVE">Inactive only</option>
          </SelectField>
        </div>

        <div className="mt-6">
          {usersPageStatus === "loading" ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-sm text-slate-500">
              Loading users...
            </div>
          ) : usersPageError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-10 text-sm text-rose-700">
              {usersPageError}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-500">
              No users matched the current filters.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="hidden grid-cols-[1.2fr_1.2fr_0.8fr_0.7fr_1fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:grid">
                <span>User</span>
                <span>Contact</span>
                <span>Role</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="grid gap-4 px-4 py-4 lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.7fr_1fr] lg:items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">ID #{user.id}</p>
                    </div>

                    <div className="text-sm text-slate-600">
                      <div>{user.email}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {user.phoneNumber}
                      </div>
                    </div>

                    <div className="text-sm text-slate-700">
                      {user.role?.replaceAll("_", " ")}
                    </div>

                    <div>
                      <Badge variant={user.isActive ? "success" : "neutral"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
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
                          className="gap-2 px-3 py-2 text-rose-700 hover:border-rose-200 hover:text-rose-800"
                          onClick={() => handleToggleActive(user)}
                        >
                          <UserX className="h-4 w-4" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          className="gap-2 px-3 py-2 text-emerald-700 hover:border-emerald-200 hover:text-emerald-800"
                          onClick={() => handleToggleActive(user)}
                        >
                          <UserCheck className="h-4 w-4" />
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
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
      </Card>

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
