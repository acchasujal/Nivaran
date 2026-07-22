const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api');

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

export const FALLBACK_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%23F1F5F9'/><text x='50%' y='50%' font-family='sans-serif' font-size='24' fill='%2394A3B8' text-anchor='middle' dy='.3em'>Evidence Image Unavailable</text></svg>";

const memoCache = new Map<string, string>();

export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return FALLBACK_PLACEHOLDER;
  
  if (memoCache.has(path)) {
    return memoCache.get(path)!;
  }
  
  let resolvedUrl = FALLBACK_PLACEHOLDER;
  const trimmed = path.trim();
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    resolvedUrl = trimmed;
  } else {
    // Demo images reside directly in frontend static /public folder (e.g. /demo_pothole1.jpg)
    if (trimmed.includes('demo_')) {
      const parts = trimmed.split('/');
      const filename = parts[parts.length - 1];
      resolvedUrl = '/' + filename;
    } else if (trimmed.startsWith('demo_') || trimmed.startsWith('/demo_')) {
      resolvedUrl = trimmed.startsWith('/') ? trimmed : '/' + trimmed;
    } else if (trimmed.startsWith('static/') || trimmed.startsWith('/static/')) {
      const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
      resolvedUrl = VITE_API_HOST ? `${VITE_API_HOST}/${cleanPath}` : `/${cleanPath}`;
    } else if (trimmed.startsWith('uploads/') || trimmed.startsWith('/uploads/')) {
      const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
      resolvedUrl = VITE_API_HOST ? `${VITE_API_HOST}/static/${cleanPath}` : `/static/${cleanPath}`;
    } else {
      const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
      resolvedUrl = VITE_API_HOST ? `${VITE_API_HOST}/${cleanPath}` : `/${cleanPath}`;
    }
  }

  
  memoCache.set(path, resolvedUrl);
  return resolvedUrl;
};
