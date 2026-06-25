import axios from 'axios';

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to construct full URL for static files (e.g. uploaded photos, exported PDFs)
export const getStaticUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // Clean prefix slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${VITE_API_BASE_URL}/${cleanPath}`;
};
