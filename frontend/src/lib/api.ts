import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "./constants";
import { updateSocketToken } from "./socket";
import { useAuthStore } from "@/stores/authStore";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(ACCESS_TOKEN_KEY)
      : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 with token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const NON_REFRESHABLE_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/temporary",
  "/auth/verify-email",
  "/auth/verify-phone",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verification-status",
  "/auth/resend-verification",
];

const isNonRefreshableAuthRequest = (url?: string) => {
  if (!url) return false;
  return NON_REFRESHABLE_AUTH_PATHS.some((path) => url.includes(path));
};

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  failedQueue = [];
}

function persistAuthTokens(newAccessToken: string, newRefreshToken: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
  document.cookie = `access_token=${newAccessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  updateSocketToken(newAccessToken);
  useAuthStore.setState((state) => ({
    ...state,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    isAuthenticated: true,
  }));
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isNonRefreshableAuthRequest(originalRequest.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem(REFRESH_TOKEN_KEY)
            : null;

        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const newAccessToken: string = data.data.accessToken;
        const newRefreshToken: string = data.data.refreshToken;

        persistAuthTokens(newAccessToken, newRefreshToken);

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear auth state and redirect to login
        if (typeof window !== "undefined") {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
