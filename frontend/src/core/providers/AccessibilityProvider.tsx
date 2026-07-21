import React, { createContext, useContext, useState, useEffect } from 'react';

export type TextScale = 'standard' | 'large' | 'extra-large';

export interface AccessibilityContextType {
  textScale: TextScale;
  setTextScale: (scale: TextScale) => void;
  reducedMotion: boolean;
  announce: (message: string, urgency?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textScale, setTextScaleState] = useState<TextScale>(() => {
    return (localStorage.getItem('civicpulse_text_scale') as TextScale) || 'standard';
  });
  const [announcement, setAnnouncement] = useState<{ message: string; urgency: 'polite' | 'assertive' } | null>(null);

  const reducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    localStorage.setItem('civicpulse_text_scale', textScale);
    document.documentElement.setAttribute('data-text-scale', textScale);
  }, [textScale]);

  const announce = (message: string, urgency: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement({ message, urgency });
    setTimeout(() => setAnnouncement(null), 3000);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        textScale,
        setTextScale: setTextScaleState,
        reducedMotion,
        announce,
      }}
    >
      {children}

      {/* Global WCAG Polite / Assertive Live Region */}
      {announcement && (
        <div
          role={announcement.urgency === 'assertive' ? 'alert' : 'status'}
          aria-live={announcement.urgency}
          className="sr-only"
        >
          {announcement.message}
        </div>
      )}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
