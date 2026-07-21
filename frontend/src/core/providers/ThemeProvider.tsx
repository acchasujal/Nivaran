import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'high-contrast';

export interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleHighContrast: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('civicpulse_theme_mode') as ThemeMode) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('civicpulse_theme_mode', mode);
    if (mode === 'high-contrast') {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [mode]);

  const toggleHighContrast = () => {
    setModeState((prev) => (prev === 'high-contrast' ? 'light' : 'high-contrast'));
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode: setModeState, toggleHighContrast }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
