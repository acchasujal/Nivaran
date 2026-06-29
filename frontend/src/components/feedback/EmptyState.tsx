import React from 'react';
import { FileQuestion } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No reports yet.',
  description = 'Submit the first verified report for this area.',
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
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary border border-primary/10 mb-4 shrink-0 shadow-sm animate-fade">
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
