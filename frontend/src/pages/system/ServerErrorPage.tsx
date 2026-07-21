import React from 'react';
import { ErrorState } from '../../design-system/primitives/feedback/ErrorState';
import { usePageTitle } from '../../core/hooks/usePageTitle';

export const ServerErrorPage: React.FC = () => {
  usePageTitle('500 — Server Error');

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full">
        <ErrorState
          title="Internal Server Error (500)"
          description="The CivicPulse backend service encountered an unexpected condition. Local draft data remains safe."
          onRetry={() => window.location.reload()}
          retryLabel="Retry Connection"
        />
      </div>
    </div>
  );
};
