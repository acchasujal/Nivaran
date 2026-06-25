import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-8 md:py-10 border-b border-secondary-border',
        className
      )}
      {...props}
    >
      <div className="space-y-1.5 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-secondary-foreground font-sans">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base text-slate-500 font-normal leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center shrink-0">{action}</div>}
    </div>
  );
};
