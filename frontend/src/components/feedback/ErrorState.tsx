import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  explanation: string;
  onRetry?: () => void;
  retryText?: string;
  icon?: LucideIcon;
  isSubmitting?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  explanation,
  onRetry,
  retryText = 'Try Again',
  icon: Icon = AlertCircle,
  isSubmitting = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12 border border-rose-100 rounded-medium bg-rose-50/30 w-full min-h-[250px]',
        className
      )}
      {...props}
    >
      {/* Icon block */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-4 shrink-0">
        <Icon size={24} className="stroke-[1.5]" />
      </div>

      {/* Text block */}
      <div className="space-y-1.5 max-w-md mb-6">
        <h3 className="text-sm font-semibold text-rose-950 font-sans">
          {title}
        </h3>
        <p className="text-xs text-rose-700/80 font-normal leading-relaxed font-sans">
          {explanation}
        </p>
      </div>

      {/* Retry Action */}
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 border border-rose-200 bg-white text-xs font-semibold text-rose-700 rounded-small hover:bg-rose-50/50 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <RotateCcw size={14} className={cn(isSubmitting && 'animate-spin')} />
          <span>{isSubmitting ? 'Retrying...' : retryText}</span>
        </button>
      )}
    </div>
  );
};
export default ErrorState;
