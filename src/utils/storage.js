export const storage = {
  get(key) {
    try {
      // Wrapped in try/catch so storage restrictions do not crash the app.
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage failure should degrade gracefully, not break UI rendering.
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Same graceful-failure principle here.
    }
  },
};
