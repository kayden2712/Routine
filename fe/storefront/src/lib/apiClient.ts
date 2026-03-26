import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor - Add JWT token to headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authData = localStorage.getItem('routine-customer-auth');
    
    if (authData) {
      try {
        const { customer } = JSON.parse(authData);
        if (customer?.token) {
          config.headers.Authorization = `Bearer ${customer.token}`;
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
      
      // 401 Unauthorized - Token expired or invalid
      if (status === 401) {
        localStorage.removeItem('routine-customer-auth');
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
      
      // 403 Forbidden - Insufficient permissions
      if (status === 403) {
        return Promise.reject(new Error('You do not have permission to perform this action.'));
      }
      
      // 404 Not Found
      if (status === 404) {
        return Promise.reject(new Error(data?.message || 'Resource not found.'));
      }
      
      // 500 Server Error
      if (status >= 500) {
        return Promise.reject(new Error('Server error. Please try again later.'));
      }
      
      // Other errors
      return Promise.reject(new Error(data?.message || 'An error occurred.'));
    }
    
    // Network error
    if (error.request) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
