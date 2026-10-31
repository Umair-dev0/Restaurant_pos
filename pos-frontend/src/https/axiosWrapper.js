import axios from "axios";

const defaultHeader = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export const axiosWrapper = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "",
  withCredentials: true,
  headers: { ...defaultHeader },
});

// Automatically attach stored token to headers for reliable cross-context requests
axiosWrapper.interceptors.request.use((reqConfig) => {
  try {
    const token = localStorage.getItem("pos_token");
    if (token && reqConfig.headers) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore storage errors
  }
  return reqConfig;
});
