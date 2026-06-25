import React from 'react';
import { FileQuestion } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description,
  action,
  icon: Icon = FileQuestion,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12 border border-dashed border-slate-200 rounded-medium bg-slate-50/50 w-full min-h-[300px]',
        className
      )}
      {...props}
    >
      {/* Icon block */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4 shrink-0">
        <Icon size={24} className="stroke-[1.5]" />
      </div>

      {/* Text block */}
      <div className="space-y-1 max-w-md mb-6">
        <h3 className="text-sm font-semibold text-secondary-foreground font-sans">
          {title}
        </h3>
        <p className="text-xs text-slate-500 font-normal leading-relaxed font-sans">
          {description}
        </p>
      </div>

      {/* Action block */}
      {action && <div className="flex justify-center shrink-0">{action}</div>}
    </div>
  );
};
export default EmptyState;
