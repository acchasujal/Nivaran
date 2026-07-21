import axios from 'axios';

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api');

export const apiClient = axios.create({
  baseURL: VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Auth Token Injection
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('civicpulse_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Error Normalization
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = {
      message: error.response?.data?.detail || error.message || 'An unexpected API communication error occurred.',
      status: error.response?.status || 500,
      code: error.code || 'ERR_NETWORK',
    };
    return Promise.reject(normalizedError);
  }
);

const getApiHost = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      return parsed.origin;
    } catch {
      return 'http://localhost:8000';
    }
  }
  return '';
};

const VITE_API_HOST = getApiHost(VITE_API_BASE_URL);

export const getStaticUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  if (VITE_API_HOST) {
    return `${VITE_API_HOST}/${cleanPath}`;
  }
  return `/${cleanPath}`;
};
