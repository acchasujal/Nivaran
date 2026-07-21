import React, { createContext, useContext, useState } from 'react';
import type { PermissionType } from '../../design-system/primitives/overlays/PermissionDialog';

export interface PermissionStatus {
  camera: 'prompt' | 'granted' | 'denied';
  location: 'prompt' | 'granted' | 'denied';
  notifications: 'prompt' | 'granted' | 'denied';
  storage: 'granted';
}

export interface PermissionContextType {
  permissions: PermissionStatus;
  requestPermission: (type: PermissionType) => Promise<boolean>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: 'prompt',
    location: 'prompt',
    notifications: 'prompt',
    storage: 'granted',
  });

  const requestPermission = async (type: PermissionType): Promise<boolean> => {
    if (type === 'location') {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          setPermissions((prev) => ({ ...prev, location: 'denied' }));
          resolve(false);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          () => {
            setPermissions((prev) => ({ ...prev, location: 'granted' }));
            resolve(true);
          },
          () => {
            setPermissions((prev) => ({ ...prev, location: 'denied' }));
            resolve(false);
          }
        );
      });
    }

    if (type === 'camera') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        setPermissions((prev) => ({ ...prev, camera: 'granted' }));
        return true;
      } catch {
        setPermissions((prev) => ({ ...prev, camera: 'denied' }));
        return false;
      }
    }

    return true;
  };

  return (
    <PermissionContext.Provider value={{ permissions, requestPermission }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};
