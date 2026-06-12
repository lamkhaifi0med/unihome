import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

let authToken = null;

export function setAxiosToken(token) {
  authToken = token;
}

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    config.headers.delete?.("Content-Type");
    delete config.headers["Content-Type"];
  }
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

let logoutCallback = null;
export function setAxiosLogout(fn) {
  logoutCallback = fn;
}

let navigateToLoginCallback = null;
export function setNavigateToLogin(fn) {
  navigateToLoginCallback = fn;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      logoutCallback &&
      !error.config?._silentAuth
    ) {
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        logoutCallback();
        if (navigateToLoginCallback) {
          navigateToLoginCallback();
        } else {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
