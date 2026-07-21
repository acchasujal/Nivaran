import React from 'react';
import { Outlet } from 'react-router-dom';
import { InstitutionalQueueLayout } from '../design-system/layouts/InstitutionalQueueLayout';
import { useAuth } from '../core/providers/AuthProvider';

export const GovernmentShell: React.FC = () => {
  const { user } = useAuth();

  return (
    <InstitutionalQueueLayout
      departmentName={user?.department || 'Public Works Department'}
      queueCount={14}
      queueTable={<Outlet />}
    />
  );
};
