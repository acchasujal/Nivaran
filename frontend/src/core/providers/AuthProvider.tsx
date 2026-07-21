import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'citizen' | 'officer' | 'auditor' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  department?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  role: UserRole;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  featureFlags: Record<string, boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_FLAGS: Record<string, boolean> = {
  enableWhatsAppDispatch: true,
  enableAIInferenceBanner: true,
  enableMapMarkerClustering: true,
  enableOfflineQueueSync: true,
  enableGovernmentSLAAlerts: true,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('civicpulse_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return {
      id: 'ANON-001',
      name: 'Anonymous Citizen',
      role: 'citizen',
    };
  });

  const login = (token: string, newUser: UserProfile) => {
    localStorage.setItem('civicpulse_token', token);
    localStorage.setItem('civicpulse_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('civicpulse_token');
    localStorage.removeItem('civicpulse_user');
    setUser({
      id: 'ANON-001',
      name: 'Anonymous Citizen',
      role: 'citizen',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && user.id !== 'ANON-001'),
        role: user?.role || 'citizen',
        login,
        logout,
        featureFlags: DEFAULT_FLAGS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
