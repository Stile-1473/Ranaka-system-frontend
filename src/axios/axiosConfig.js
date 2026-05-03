import axios from "axios";
import { API_BASE_URL } from "../config/env";
import { AUTH_TOKEN_KEY } from "../config/constants";
import { storage } from "../utils/storage";

// Shared axios instance following the same pattern you showed in your example file.
const axiosConfig = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

axiosConfig.interceptors.request.use((config) => {
  // Automatically attach the stored JWT so services stay clean and minimal.
  const token = storage.get(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosConfig;
