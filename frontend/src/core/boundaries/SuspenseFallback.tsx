import React from 'react';
import { Skeleton } from '../../design-system/primitives/feedback/Skeleton';

export interface SuspenseFallbackProps {
  label?: string;
}

export const SuspenseFallback: React.FC<SuspenseFallbackProps> = ({ label = 'Loading page route...' }) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className="w-full max-w-screen-md mx-auto p-6 space-y-4 font-sans animate-fade"
    >
      <Skeleton variant="text" className="h-8 w-48" />
      <Skeleton variant="card" className="h-40 w-full" />
      <div className="space-y-2">
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="h-4 w-3/4" />
      </div>
    </div>
  );
};
