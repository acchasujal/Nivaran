import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { CitizenShellLayout } from '../design-system/layouts/CitizenShellLayout';
import { useConnectivity } from '../core/providers/ConnectivityProvider';

export const CitizenShell: React.FC = () => {
  const { isOnline } = useConnectivity();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = (): 'home' | 'report' | 'my-reports' => {
    if (location.pathname.startsWith('/report')) return 'report';
    if (location.pathname.startsWith('/tracker') || location.pathname.startsWith('/my-reports')) return 'my-reports';
    return 'home';
  };

  const handleNavigate = (tab: 'home' | 'report' | 'my-reports') => {
    if (tab === 'home') navigate('/');
    else if (tab === 'report') navigate('/report');
    else if (tab === 'my-reports') navigate('/tracker');
  };

  return (
    <CitizenShellLayout
      isOffline={!isOnline}
      activeNav={getActiveTab()}
      onNavigate={handleNavigate}
      onReportClick={() => navigate('/report')}
    >
      <Outlet />
    </CitizenShellLayout>
  );
};
