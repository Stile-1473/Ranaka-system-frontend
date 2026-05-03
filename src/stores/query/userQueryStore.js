import { create } from "zustand";
import { getUsers } from "../../services/userService";
import { createBaseQueryStore } from "../base/createBaseQueryStore";

const createUsersPageQuery = createBaseQueryStore({
  dataKey: "usersPage",
  statusKey: "usersPageStatus",
  errorKey: "usersPageError",
  actionName: "fetchUsersPage",
  initialData: {
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
  queryFn: getUsers,
  transformResponse: (response) => ({
    content: response?.content ?? [],
    page: response?.page ?? 0,
    size: response?.size ?? 10,
    totalElements: response?.totalElements ?? 0,
    totalPages: response?.totalPages ?? 0,
  }),
});

export const useUserQueryStore = create((set, get) => ({
  ...createUsersPageQuery(set, get),
}));
