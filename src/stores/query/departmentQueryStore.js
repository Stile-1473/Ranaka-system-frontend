import { create } from "zustand";
import {
  getActiveDepartments,
  getAllDepartments,
} from "../../services/departmentService";
import { createBaseQueryStore } from "../base/createBaseQueryStore";

const createActiveDepartmentsQuery = createBaseQueryStore({
  dataKey: "activeDepartments",
  statusKey: "activeDepartmentsStatus",
  errorKey: "activeDepartmentsError",
  actionName: "fetchActiveDepartments",
  initialData: [],
  queryFn: getActiveDepartments,
  transformResponse: (response) => (Array.isArray(response) ? response : []),
});

const createAllDepartmentsQuery = createBaseQueryStore({
  dataKey: "departments",
  statusKey: "departmentsStatus",
  errorKey: "departmentsError",
  actionName: "fetchDepartments",
  initialData: [],
  queryFn: getAllDepartments,
  transformResponse: (response) => (Array.isArray(response) ? response : []),
});

export const useDepartmentQueryStore = create((set, get) => ({
  ...createActiveDepartmentsQuery(set, get),
  ...createAllDepartmentsQuery(set, get),
}));
