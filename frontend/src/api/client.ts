import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken: string | null = null;
let csrfToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const setCsrfToken = (token: string | null) => {
  csrfToken = token;
};

export const getCsrfToken = () => csrfToken;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const csrf = csrfToken || getCookie('csrf_token');
  if (csrf && config.headers) {
    config.headers['x-csrf-token'] = csrf;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    const token = response.data?.data?.accessToken || response.data?.accessToken;
    if (token) {
      setAccessToken(token);
    }
    const csrf = response.data?.data?.csrfToken || response.data?.csrfToken;
    if (csrf) {
      setCsrfToken(csrf);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const currentCsrf = csrfToken || getCookie('csrf_token');
        const refreshResponse = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          {
            headers: currentCsrf ? { 'x-csrf-token': currentCsrf } : {},
            withCredentials: true,
          }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken || refreshResponse.data?.accessToken;
        const newCsrf = refreshResponse.data?.data?.csrfToken || refreshResponse.data?.csrfToken;

        if (newAccessToken) {
          setAccessToken(newAccessToken);
        }
        if (newCsrf) {
          setCsrfToken(newCsrf);
        }

        if (newAccessToken && originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }

        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        setAccessToken(null);
        setCsrfToken(null);
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
