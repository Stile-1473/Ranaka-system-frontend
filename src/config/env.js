// Accept env values with or without trailing slash and normalize them once.
const trimTrailingSlash = (value) => String(value || "").replace(/\/$/, "");

// Central environment-driven URLs used across axios and WebSocket setup.
export const APP_NAME = "Ranaka Procurement System";
export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5005/api/v1"
);
export const WS_URL = trimTrailingSlash(
  import.meta.env.VITE_WS_URL || "http://localhost:5005/ws"
);
