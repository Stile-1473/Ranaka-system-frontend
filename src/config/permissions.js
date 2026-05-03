import { USER_ROLES } from "./constants";

// Maps each role to the page they should land on after login.
export const roleRouteMap = {
  [USER_ROLES.REQUESTER]: "/dashboard",
  [USER_ROLES.ADMIN]: "/admin/dashboard",
  [USER_ROLES.GM]: "/gm/dashboard",
  [USER_ROLES.CEO]: "/ceo/dashboard",
  [USER_ROLES.SYSTEM_ADMIN]: "/system/dashboard",
};

// Safe fallback so unknown role values do not break navigation.
export const getDefaultRouteForRole = (role) =>
  roleRouteMap[role] || "/login";
