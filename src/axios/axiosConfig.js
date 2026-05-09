import axios from "axios";
import { API_BASE_URL } from "../config/env";
import { AUTH_TOKEN_KEY } from "../config/constants";
import { storage } from "../utils/storage";

const RETRYABLE_METHODS = new Set(["get", "head", "options"]);
const RETRY_DELAY_MS = 2500;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRecoverableError = (error) => {
  if (!error) {
    return false;
  }

  if (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK") {
    return true;
  }

  if (!error.response && error.request) {
    return true;
  }

  return Number(error.response?.status) >= 502;
};

// Shared axios instance following the same pattern you showed in your example file.
const axiosConfig = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 45000,
});

axiosConfig.interceptors.request.use((config) => {
  // Automatically attach the stored JWT so services stay clean and minimal.
  const token = storage.get(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosConfig.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    const method = String(config?.method || "get").toLowerCase();
    const retryCount = Number(config?.__retryCount || 0);

    if (
      config &&
      RETRYABLE_METHODS.has(method) &&
      retryCount < 1 &&
      isRecoverableError(error)
    ) {
      config.__retryCount = retryCount + 1;
      await delay(RETRY_DELAY_MS);
      return axiosConfig(config);
    }

    return Promise.reject(error);
  }
);

export default axiosConfig;
