import axios from 'axios';

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api');

export const apiClient = axios.create({
  baseURL: VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Helper to construct full URL for static files (e.g. uploaded photos, exported PDFs)
export const getStaticUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // Clean prefix slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  if (VITE_API_HOST) {
    return `${VITE_API_HOST}/${cleanPath}`;
  }
  return `/${cleanPath}`;
};
