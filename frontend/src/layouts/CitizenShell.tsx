import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { CitizenShellLayout } from '../design-system/layouts/CitizenShellLayout';
import { useConnectivity } from '../core/providers/ConnectivityProvider';
import { useAuth } from '../core/providers/AuthProvider';
import { AuthModal } from '../components/auth/AuthModal';
import { TourProvider } from '../context/TourContext';
import { Shield } from 'lucide-react';

export const CitizenShell: React.FC = () => {
  const { isOnline } = useConnectivity();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('nivaran_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('nivaran_sidebar_collapsed', String(next));
      return next;
    });
  };

  const getActiveTab = (): string => {
    const path = location.pathname;
    if (path.startsWith('/report')) return 'report';
    if (path.startsWith('/tracker') || path.startsWith('/my-reports') || path.startsWith('/discover')) return 'my-reports';
    if (path.startsWith('/government/queue')) return 'government';
    if (path.startsWith('/internal/document-review')) return 'document-review';
    if (path.startsWith('/internal/admin')) return 'admin';
    if (path.startsWith('/internal/evaluate')) return 'evaluate';
    if (path.startsWith('/community')) return 'community';
    return 'home';
  };

  const handleNavigate = (tab: string) => {
    if (tab === 'home') navigate('/');
    else if (tab === 'report') navigate('/report');
    else if (tab === 'my-reports') navigate('/discover');
    else if (tab === 'government') navigate('/government/queue');
    else if (tab === 'document-review') navigate('/government/queue');
    else if (tab === 'admin') navigate('/internal/admin');
    else if (tab === 'evaluate') navigate('/internal/evaluate');
    else if (tab === 'community') navigate('/community');
  };

  const accountButton = (
    <button
      type="button"
      onClick={() => setAuthModalOpen(true)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-pill text-xs font-bold shadow-subtle transition-all cursor-pointer active:scale-95"
      title="Switch Role Account / Auth Modal"
    >
      <Shield size={13} />
      <span className="truncate max-w-[120px]">{user?.name || 'Demo Login'}</span>
      <span className="bg-teal-900/60 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">{role}</span>
    </button>
  );

  return (
    <>
      <CitizenShellLayout
        isOffline={!isOnline}
        activeNav={getActiveTab() as any}
        onNavigate={handleNavigate}
        onReportClick={() => navigate('/report')}
        actions={accountButton}
        userProfile={user ? { name: user.name, avatarUrl: user.avatarUrl } : undefined}
        onProfileClick={() => setAuthModalOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      >
        <TourProvider>
          <Outlet />
        </TourProvider>
      </CitizenShellLayout>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};
