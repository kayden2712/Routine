import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return url.includes('/auth/admin/login')
    || url.includes('/auth/customer/login')
    || url.includes('/auth/refresh');
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true;
    }

    const payload = JSON.parse(atob(parts[1])) as { exp?: number };
    if (!payload.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  } catch {
    return true;
  }
}

function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const payload = data as {
    message?: string;
    data?: unknown;
  };

  if (payload.message && payload.message !== 'Validation failed') {
    return payload.message;
  }

  if (payload.data && typeof payload.data === 'object') {
    const firstEntry = Object.values(payload.data as Record<string, unknown>)[0];
    if (typeof firstEntry === 'string' && firstEntry.trim()) {
      return firstEntry;
    }
  }

  return payload.message ?? null;
}

// Request interceptor - Add JWT token to headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (isAuthEndpoint(config.url)) {
      return config;
    }

    const authData = localStorage.getItem('routine-auth');

    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        const isAuthenticated = Boolean(parsed?.state?.isAuthenticated ?? parsed?.isAuthenticated);
        const token = parsed?.state?.user?.token ?? parsed?.user?.token;

        if (isAuthenticated && (!token || isTokenExpired(token))) {
          localStorage.removeItem('routine-auth');
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired. Please login again.'));
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // Transform response to extract data field
    if (response.data?.success && response.data?.data !== undefined) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error: AxiosError<{ success: boolean; message: string; data: null }>) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;
      
      // 401 Unauthorized - Token expired or invalid (but NOT for login endpoint)
      if (status === 401) {
        // Don't redirect on login endpoint - let component handle it
        const isLoginRequest = error.config?.url?.includes('/auth/admin/login') || 
                              error.config?.url?.includes('/auth/customer/login');
        
        if (!isLoginRequest) {
          localStorage.removeItem('routine-auth');
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired. Please login again.'));
        }
        // For login endpoint, fall through to extract error message below
      }
      
      // 403 Forbidden - Insufficient permissions
      if (status === 403) {
        return Promise.reject(new Error('You do not have permission to perform this action.'));
      }
      
      // 404 Not Found
      if (status === 404) {
        return Promise.reject(new Error(extractErrorMessage(data) || 'Resource not found.'));
      }
      
      // 500 Server Error
      if (status >= 500) {
        return Promise.reject(new Error(extractErrorMessage(data) || 'Server error. Please try again later.'));
      }

      // 400 Bad Request
      if (status === 400) {
        return Promise.reject(new Error(extractErrorMessage(data) || 'Dữ liệu không hợp lệ hoặc trùng'));
      }
      
      // Other errors
      return Promise.reject(new Error(extractErrorMessage(data) || 'An error occurred.'));
    }
    
    // Network error
    if (error.request) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
