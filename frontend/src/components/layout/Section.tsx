import React from 'react';
import { cn } from '@/lib/utils';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  title,
  description,
  children,
  className,
  ...props
}) => {
  return (
    <section className={cn('py-6 md:py-8 border-b border-secondary-border last:border-0', className)} {...props}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-xl md:text-2xl font-semibold text-secondary-foreground tracking-tight">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
};
