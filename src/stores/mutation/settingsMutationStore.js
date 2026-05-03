import { create } from "zustand";
import {
  updatePrioritySettings,
  updateSlaSettings,
} from "../../services/settingsService";
import { createBaseMutationStore } from "../base/createBaseMutationStore";

const createSlaMutation = createBaseMutationStore({
  statusKey: "updateSlaStatus",
  errorKey: "updateSlaError",
  actionName: "saveSlaSettings",
  mutationFn: updateSlaSettings,
});

const createPriorityMutation = createBaseMutationStore({
  statusKey: "updatePriorityStatus",
  errorKey: "updatePriorityError",
  actionName: "savePrioritySettings",
  mutationFn: updatePrioritySettings,
});

export const useSettingsMutationStore = create((set, get) => ({
  ...createSlaMutation(set, get),
  ...createPriorityMutation(set, get),
}));
