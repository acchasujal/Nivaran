import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'citizen' | 'community_volunteer' | 'officer' | 'department_admin' | 'auditor' | 'admin';

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
  enableOfflineQueueSync: false,
  enableGovernmentSLAAlerts: true,
  enableInternalEvaluation: false,
};

const featureFlags = {
  ...DEFAULT_FLAGS,
  enableInternalEvaluation: import.meta.env.VITE_ENABLE_EVALUATION === 'true',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('nivaran_user');
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
    localStorage.setItem('nivaran_token', token);
    localStorage.setItem('nivaran_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('nivaran_token');
    localStorage.removeItem('nivaran_user');
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
        featureFlags,
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
