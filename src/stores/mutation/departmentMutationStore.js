import { create } from "zustand";
import {
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from "../../services/departmentService";
import { createBaseMutationStore } from "../base/createBaseMutationStore";

const createDepartmentCreateMutation = createBaseMutationStore({
  statusKey: "createDepartmentStatus",
  errorKey: "createDepartmentError",
  actionName: "createSystemDepartment",
  mutationFn: createDepartment,
});

const createDepartmentUpdateMutation = createBaseMutationStore({
  statusKey: "updateDepartmentStatus",
  errorKey: "updateDepartmentError",
  actionName: "updateSystemDepartment",
  mutationFn: updateDepartment,
});

const createDepartmentDeleteMutation = createBaseMutationStore({
  statusKey: "deleteDepartmentStatus",
  errorKey: "deleteDepartmentError",
  actionName: "deleteSystemDepartment",
  mutationFn: deleteDepartment,
});

export const useDepartmentMutationStore = create((set, get) => ({
  ...createDepartmentCreateMutation(set, get),
  ...createDepartmentUpdateMutation(set, get),
  ...createDepartmentDeleteMutation(set, get),
}));
