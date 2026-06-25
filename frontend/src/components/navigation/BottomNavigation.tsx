import React from 'react';
import { NavLink } from 'react-router-dom';
import { Camera, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  className?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ className }) => {
  const navItems = [
    {
      to: '/',
      label: 'Submit',
      icon: Camera,
    },
    {
      to: '/tracker',
      label: 'Tracker',
      icon: Map,
    },
  ];

  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-secondary-border bg-white flex items-center justify-around px-4 pb-safe z-30 shadow-lg select-none',
        className
      )}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-all gap-1',
                isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
              )
            }
          >
            <Icon size={20} className="transition-transform active:scale-95" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
