let loadPromise: Promise<void> | null = null;

export const loadGoogleMaps = (): Promise<void> => {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Browser environment required'));
      return;
    }

    if ((window as any).google && (window as any).google.maps) {
      resolve();
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    const callbackName = 'initGoogleMapsCallback';

    (window as any)[callbackName] = () => {
      resolve();
      try {
        delete (window as any)[callbackName];
      } catch (e) {
        (window as any)[callbackName] = undefined;
      }
    };

    const scriptId = 'google-maps-js-api';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = (err) => {
        reject(err);
      };
      document.head.appendChild(script);
    } else {
      // Script is already in the DOM, poll until Google Maps object is ready
      const checkInterval = setInterval(() => {
        if ((window as any).google && (window as any).google.maps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    }
  });

  return loadPromise;
};

export default loadGoogleMaps;
