import { create } from "zustand";
import {
  getPrioritySettings,
  getSlaSettings,
  getWorkflowSettings,
} from "../../services/settingsService";
import { createBaseQueryStore } from "../base/createBaseQueryStore";

const createSlaQuery = createBaseQueryStore({
  dataKey: "slaSettings",
  statusKey: "slaSettingsStatus",
  errorKey: "slaSettingsError",
  actionName: "fetchSlaSettings",
  initialData: null,
  queryFn: getSlaSettings,
});

const createPriorityQuery = createBaseQueryStore({
  dataKey: "prioritySettings",
  statusKey: "prioritySettingsStatus",
  errorKey: "prioritySettingsError",
  actionName: "fetchPrioritySettings",
  initialData: null,
  queryFn: getPrioritySettings,
});

const createWorkflowQuery = createBaseQueryStore({
  dataKey: "workflowSettings",
  statusKey: "workflowSettingsStatus",
  errorKey: "workflowSettingsError",
  actionName: "fetchWorkflowSettings",
  initialData: null,
  queryFn: getWorkflowSettings,
});

export const useSettingsQueryStore = create((set, get) => ({
  ...createSlaQuery(set, get),
  ...createPriorityQuery(set, get),
  ...createWorkflowQuery(set, get),
}));
