import { create } from "zustand";
import {
  activateUser,
  createUser,
  deactivateUser,
  updateUser,
} from "../../services/userService";
import { createBaseMutationStore } from "../base/createBaseMutationStore";

const createCreateUserMutation = createBaseMutationStore({
  statusKey: "createUserStatus",
  errorKey: "createUserError",
  actionName: "createSystemUser",
  mutationFn: createUser,
});

const createUpdateUserMutation = createBaseMutationStore({
  statusKey: "updateUserStatus",
  errorKey: "updateUserError",
  actionName: "updateSystemUser",
  mutationFn: updateUser,
});

const createActivateUserMutation = createBaseMutationStore({
  statusKey: "activateUserStatus",
  errorKey: "activateUserError",
  actionName: "activateSystemUser",
  mutationFn: activateUser,
});

const createDeactivateUserMutation = createBaseMutationStore({
  statusKey: "deactivateUserStatus",
  errorKey: "deactivateUserError",
  actionName: "deactivateSystemUser",
  mutationFn: deactivateUser,
});

export const useUserMutationStore = create((set, get) => ({
  ...createCreateUserMutation(set, get),
  ...createUpdateUserMutation(set, get),
  ...createActivateUserMutation(set, get),
  ...createDeactivateUserMutation(set, get),
}));
