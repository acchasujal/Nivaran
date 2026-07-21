import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../providers/AuthProvider';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredFeatureFlag?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredFeatureFlag,
}) => {
  const { role, featureFlags } = useAuth();
  const location = useLocation();

  if (requiredFeatureFlag && !featureFlags[requiredFeatureFlag]) {
    return <Navigate to="/maintenance" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
