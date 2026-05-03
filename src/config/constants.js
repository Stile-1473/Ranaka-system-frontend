// Local storage keys for auth/session state.
export const AUTH_TOKEN_KEY = "ranaka_token";
export const AUTH_ROLE_KEY = "ranaka_role";

// Shared role names used by routing, navigation, and permission logic.
export const USER_ROLES = {
  REQUESTER: "REQUESTER",
  ADMIN: "ADMIN",
  GM: "GM",
  CEO: "CEO",
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
};

// Reusable request priority values for forms and filters.
export const REQUEST_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
