import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  variant?: 'card' | 'page' | 'spinner';
  count?: number;
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  count = 1,
  message = 'Loading content...',
  className,
}) => {
  if (variant === 'card') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-6 w-full', className)}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="border border-secondary-border bg-white rounded-medium p-6 space-y-4 animate-pulse select-none"
          >
            {/* Header placeholder */}
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
              <div className="h-6 bg-slate-200 rounded-small w-16" />
            </div>

            {/* Description placeholder */}
            <div className="space-y-2 pt-2">
              <div className="h-3 bg-slate-200 rounded w-full" />
              <div className="h-3 bg-slate-200 rounded w-5/6" />
            </div>

            {/* Footer metadata placeholder */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-50 gap-4">
              <div className="h-3 bg-slate-200 rounded w-20" />
              <div className="h-3 bg-slate-200 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className={cn('w-full space-y-8 py-8 animate-pulse select-none', className)}>
        {/* Page Header Skeleton */}
        <div className="space-y-3 pb-6 border-b border-secondary-border">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-100 rounded w-2/5" />
        </div>

        {/* Content Section Skeletons */}
        <div className="space-y-6">
          <div className="h-32 bg-white border border-secondary-border rounded-medium p-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-40 bg-white border border-secondary-border rounded-medium p-6" />
            <div className="h-40 bg-white border border-secondary-border rounded-medium p-6" />
            <div className="h-40 bg-white border border-secondary-border rounded-medium p-6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center space-y-3 w-full min-h-[200px]',
        className
      )}
    >
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      {message && <p className="text-sm font-medium text-slate-500 font-sans">{message}</p>}
    </div>
  );
};
export default LoadingState;
