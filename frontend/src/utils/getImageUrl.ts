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
    // Check legacy seed paths and resolve specific filenames
    if (trimmed.includes('pothole_01') || trimmed.includes('pothole1')) {
      resolvedUrl = '/demo_pothole1.jpg';
    } else if (trimmed.includes('pothole_02') || trimmed.includes('pothole2')) {
      resolvedUrl = '/demo_pothole2.jpg';
    } else if (trimmed.includes('pothole_03') || trimmed.includes('pothole3')) {
      resolvedUrl = '/demo_pothole3.jpg';
    } else if (trimmed.includes('garbage2') || trimmed.includes('garbage_02')) {
      resolvedUrl = '/demo_garbage2.jpg';
    } else if (trimmed.includes('garbage1') || trimmed.includes('garbage_01')) {
      resolvedUrl = '/demo_garbage1.jpg';
    } else if (trimmed.includes('leak2') || trimmed.includes('leak_02')) {
      resolvedUrl = '/demo_leak2.jpg';
    } else if (trimmed.includes('leak1') || trimmed.includes('leak_01')) {
      resolvedUrl = '/demo_leak1.jpg';
    } else if (trimmed.includes('streetlight')) {
      resolvedUrl = '/demo_streetlight1.jpg';
    } else if (trimmed.includes('sidewalk') || trimmed.includes('footpath')) {
      resolvedUrl = '/demo_sidewalk.jpg';
    } else if (trimmed.includes('construction') || trimmed.includes('dumping')) {
      resolvedUrl = '/demo_construction.jpg';
    } else if (trimmed.startsWith('demo_') || trimmed.startsWith('/demo_')) {
      resolvedUrl = trimmed.startsWith('/') ? trimmed : '/' + trimmed;
    } else if (trimmed.startsWith('static/') || trimmed.startsWith('/static/')) {
      const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
      resolvedUrl = VITE_API_HOST ? `${VITE_API_HOST}/${cleanPath}` : `/${cleanPath}`;
    } else if (trimmed.startsWith('uploads/') || trimmed.startsWith('/uploads/')) {
      const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
      resolvedUrl = VITE_API_HOST ? `${VITE_API_HOST}/static/${cleanPath}` : `/static/${cleanPath}`;
    } else {
      // General fallbacks
      if (trimmed.includes('pothole')) {
        resolvedUrl = '/demo_pothole1.jpg';
      } else if (trimmed.includes('streetlight')) {
        resolvedUrl = '/demo_streetlight1.jpg';
      } else if (trimmed.includes('garbage') || trimmed.includes('waste')) {
        resolvedUrl = '/demo_garbage1.jpg';
      } else if (trimmed.includes('leak') || trimmed.includes('water')) {
        resolvedUrl = '/demo_leak1.jpg';
      } else if (trimmed.includes('sidewalk') || trimmed.includes('footpath')) {
        resolvedUrl = '/demo_sidewalk.jpg';
      } else if (trimmed.includes('construction') || trimmed.includes('dumping')) {
        resolvedUrl = '/demo_construction.jpg';
      } else {
        const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
        resolvedUrl = VITE_API_HOST ? `${VITE_API_HOST}/${cleanPath}` : `/${cleanPath}`;
      }
    }
  }
  
  memoCache.set(path, resolvedUrl);
  return resolvedUrl;
};
