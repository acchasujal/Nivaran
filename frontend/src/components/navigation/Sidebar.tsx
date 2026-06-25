import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Camera, Map, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      to: '/',
      label: 'Submit Report',
      icon: Camera,
      description: 'Intake new issue',
    },
    {
      to: '/tracker',
      label: 'Public Tracker',
      icon: Map,
      description: 'View active clusters',
    },
  ];

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-secondary-border bg-white transition-all duration-300 ease-in-out select-none relative z-10',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Brand logo / header */}
      <div className="flex h-16 items-center px-6 border-b border-secondary-border overflow-hidden gap-3">
        <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-medium bg-primary text-white">
          <Activity size={18} />
        </div>
        {!isCollapsed && (
          <span className="font-semibold text-lg font-sans text-secondary-foreground whitespace-nowrap tracking-tight animate-fade">
            CivicPulse
          </span>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 space-y-1.5 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-medium text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-slate-50 text-primary border-l-2 border-primary pl-2.5'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent'
                )
              }
            >
              <Icon
                size={20}
                className="shrink-0 transition-transform group-hover:scale-105"
              />
              {!isCollapsed && (
                <div className="flex flex-col items-start leading-tight animate-fade">
                  <span>{item.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {item.description}
                  </span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-4 -right-3 flex h-6 w-6 items-center justify-center rounded-full border border-secondary-border bg-white text-slate-400 hover:text-slate-600 hover:shadow-subtle shadow-sm transition-all cursor-pointer"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
};
