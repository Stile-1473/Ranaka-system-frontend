import { USER_ROLES } from "../config/constants";

export const protectedRoutes = {
  requester: [USER_ROLES.REQUESTER],
  admin: [USER_ROLES.ADMIN],
  gm: [USER_ROLES.GM],
  ceo: [USER_ROLES.CEO],
  systemAdmin: [USER_ROLES.SYSTEM_ADMIN],
};
