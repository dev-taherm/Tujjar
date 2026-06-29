import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import type { ApiError } from "@/shared/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const customerClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Token management — isolated from platform tokens
let accessToken: string | null = null;
let refreshToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function extractStoreSlug(): string | null {
  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname;
  const storeDomain = process.env.NEXT_PUBLIC_STORE_DOMAIN || "localhost";
  const baseDomain = storeDomain.startsWith(".") ? storeDomain.slice(1) : storeDomain;
  if (hostname.endsWith(`.${baseDomain}`)) {
    return hostname.slice(0, hostname.length - baseDomain.length - 1);
  }
  const path = window.location.pathname;
  const shopMatch = path.match(/\/shop\/([^/]+)/);
  return shopMatch ? shopMatch[1] : null;
}

function processQueue(error: unknown) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
}

export function setCustomerTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== "undefined") {
    localStorage.setItem("customer_access_token", access);
    localStorage.setItem("customer_refresh_token", refresh);
  }
}

export function clearCustomerTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("customer_access_token");
    localStorage.removeItem("customer_refresh_token");
  }
}

export function loadCustomerTokens() {
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("customer_access_token");
    refreshToken = localStorage.getItem("customer_refresh_token");
  }
  return { accessToken, refreshToken };
}

// Request interceptor - attach customer JWT
customerClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!accessToken) {
      loadCustomerTokens();
    }
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
customerClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => customerClient(originalRequest));
      }

      isRefreshing = true;

      if (!refreshToken) {
        isRefreshing = false;
        clearCustomerTokens();
        if (typeof window !== "undefined") {
          const storeSlug = extractStoreSlug();
          if (storeSlug) {
            window.location.href = `/shop/${storeSlug}/login`;
          } else {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/customers/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        const { access, refresh: newRefresh } = response.data;
        setCustomerTokens(access, newRefresh || refreshToken);
        processQueue(null);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        return customerClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        clearCustomerTokens();
        if (typeof window !== "undefined") {
          const storeSlug = extractStoreSlug();
          if (storeSlug) {
            window.location.href = `/shop/${storeSlug}/login`;
          } else {
            window.location.href = "/login";
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Suppress expected errors
const SUPPRESSED_PATTERNS = ["/search/index/search_suggestions/"];

function shouldSuppress(error: AxiosError<ApiError>): boolean {
  const url = error.config?.url || "";
  return SUPPRESSED_PATTERNS.some((p) => url.includes(p));
}

// Global error response interceptor — toast for unhandled API errors
customerClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (shouldSuppress(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    if (!status || status < 400) {
      return Promise.reject(error);
    }

    if (status === 401 || typeof window === "undefined") {
      return Promise.reject(error);
    }

    const data = error.response?.data;
    const rawMessage =
      (typeof data === "object" && data !== null && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : null) ||
      (typeof data === "object" && data !== null && "error" in data
        ? (() => {
            const err = (data as { error: unknown }).error;
            if (typeof err === "object" && err !== null && "message" in err) {
              return String((err as { message: unknown }).message);
            }
            return String(err);
          })()
        : null);
    const message = rawMessage && !rawMessage.includes("/") && !rawMessage.includes("\\") && rawMessage.length < 200
      ? rawMessage
      : null;

    switch (status) {
      case 400:
        toast.error(message || "Invalid request. Please check your input.");
        break;
      case 403:
        toast.error("You don't have permission to do this.");
        break;
      case 404:
        toast.error("Resource not found.");
        break;
      case 429:
        toast.error("Too many requests. Please try again later.");
        break;
      case 500:
        toast.error("Server error. Please try again later.");
        break;
      default:
        if (status >= 500) {
          toast.error("Server error. Please try again later.");
        }
    }

    return Promise.reject(error);
  }
);

export default customerClient;
