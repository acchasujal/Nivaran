import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ConnectivityContextType {
  isOnline: boolean;
  effectiveType?: string;
  lastOnlineAt: Date | null;
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isOnline: true,
  lastOnlineAt: new Date(),
});

export const ConnectivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(() => (navigator.onLine ? new Date() : null));

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ConnectivityContext.Provider value={{ isOnline, lastOnlineAt }}>
      {children}
    </ConnectivityContext.Provider>
  );
};

export const useConnectivity = (): ConnectivityContextType => useContext(ConnectivityContext);
