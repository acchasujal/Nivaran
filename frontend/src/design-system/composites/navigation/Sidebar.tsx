import React from 'react';
import { Home, FileText, PlusCircle, ShieldCheck, FileCheck, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Logo } from '../../primitives/foundation/Logo';
import { cn } from '../../../lib/utils';

export interface SidebarProps {
  activeDestination?: string;
  onNavigate?: (destId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeDestination = 'home',
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  className,
}) => {
  const items = [
    { id: 'home', label: 'Home Feed', icon: <Home className="w-5 h-5 shrink-0" /> },
    { id: 'report', label: 'Report Issue', icon: <PlusCircle className="w-5 h-5 shrink-0" /> },
    { id: 'my-reports', label: 'Map & Reports', icon: <FileText className="w-5 h-5 shrink-0" /> },
    { id: 'government', label: 'Official Queue', icon: <ShieldCheck className="w-5 h-5 shrink-0" /> },
    { id: 'internal', label: 'Document Review', icon: <FileCheck className="w-5 h-5 shrink-0" /> },
    { id: 'admin', label: 'Admin Console', icon: <Settings className="w-5 h-5 shrink-0" /> },
  ];

  return (
    <aside
      aria-label="Desktop primary navigation"
      className={cn(
        'hidden md:flex flex-col bg-white border-r border-neutral-200 h-screen sticky top-0 font-sans transition-all duration-base z-30 select-none',
        collapsed ? 'w-16 p-2' : 'w-64 p-4',
        className
      )}
    >
      <div className="flex items-center justify-between mb-8 h-10">
        {!collapsed && <Logo size="sm" />}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
            className="p-2 rounded-pill hover:bg-neutral-100 text-neutral-700 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const isActive = activeDestination === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate?.(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'w-full flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 rounded-md font-medium text-sm transition-colors text-left cursor-pointer',
                isActive
                  ? 'bg-primary-500/10 text-primary-700 font-semibold'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900',
                collapsed && 'justify-center px-0'
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
