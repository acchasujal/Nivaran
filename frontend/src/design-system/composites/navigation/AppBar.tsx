import React from 'react';
import { ArrowLeft, WifiOff, PanelLeft } from 'lucide-react';
import { Logo } from '../../primitives/foundation/Logo';
import { IconButton } from '../../primitives/buttons/IconButton';
import { cn } from '../../../lib/utils';

export interface AppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  isOffline?: boolean;
  actions?: React.ReactNode;
  userProfile?: { name: string; avatarUrl?: string };
  onProfileClick?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  className?: string;
}

export const AppBar: React.FC<AppBarProps> = ({
  title,
  showBack = false,
  onBack,
  isOffline = false,
  actions,
  userProfile,
  onProfileClick,
  onToggleSidebar,
  sidebarCollapsed = false,
  className,
}) => {
  return (
    <header
      role="banner"
      className={cn(
        'sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200 px-4 py-2.5 min-h-[56px] flex items-center justify-between gap-3 font-sans shadow-subtle',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-2 rounded-md hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer inline-flex items-center justify-center"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <PanelLeft className="w-5 h-5 text-slate-600" />
          </button>
        )}

        {showBack && onBack ? (
          <IconButton
            icon={<ArrowLeft className="w-5 h-5" />}
            label="Go back"
            onClick={onBack}
            size="sm"
          />
        ) : (
          <div className="md:hidden">
            <Logo size="sm" />
          </div>
        )}

        {title && (
          <h1 className="text-base font-bold text-neutral-900 truncate pl-2 border-l border-neutral-200">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isOffline && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-1 rounded-pill">
            <WifiOff className="w-3.5 h-3.5" /> Offline Mode
          </span>
        )}

        {actions}

        {userProfile && (
          <button
            type="button"
            onClick={onProfileClick}
            aria-label={`Account menu for ${userProfile.name}`}
            className="p-1 rounded-pill hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors min-w-[44px] min-h-[44px] inline-flex items-center justify-center cursor-pointer"
          >
            {userProfile.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-8 h-8 rounded-pill object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-pill bg-primary-700 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                {userProfile.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
