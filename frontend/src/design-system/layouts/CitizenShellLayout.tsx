import React from 'react';
import { AppBar } from '../composites/navigation/AppBar';
import { BottomNavigation } from '../composites/navigation/BottomNavigation';
import { Sidebar } from '../composites/navigation/Sidebar';
import { OfflineBanner } from '../primitives/feedback/OfflineBanner';
import { cn } from '../../lib/utils';

export interface CitizenShellLayoutProps {
  title?: string;
  isOffline?: boolean;
  activeNav?: string;
  onNavigate?: (tab: string) => void;
  onReportClick?: () => void;
  actions?: React.ReactNode;
  userProfile?: { name: string; avatarUrl?: string };
  onProfileClick?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const CitizenShellLayout: React.FC<CitizenShellLayoutProps> = ({
  title,
  isOffline = false,
  activeNav = 'home',
  onNavigate,
  onReportClick,
  actions,
  userProfile,
  onProfileClick,
  sidebarCollapsed = false,
  onToggleSidebar,
  children,
  className,
}) => {
  return (
    <div className={cn('min-h-screen bg-neutral-50 flex flex-col md:flex-row font-sans text-neutral-900', className)}>
      <Sidebar
        activeDestination={activeNav}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={onToggleSidebar}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        {isOffline && <OfflineBanner state="offline" pendingCount={1} />}
        <AppBar
          title={title}
          isOffline={isOffline}
          actions={actions}
          userProfile={userProfile}
          onProfileClick={onProfileClick}
          onToggleSidebar={onToggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 py-6 flex flex-col">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex-1 flex flex-col">
            {children}
          </div>
        </main>

        <BottomNavigation activeTab={activeNav as any} onNavigate={onNavigate as any} onReportClick={onReportClick} />
      </div>
    </div>
  );
};
