import React from 'react';
import { Illustration } from '../../design-system/primitives/foundation/Illustration';
import { Button } from '../../design-system/primitives/buttons/Button';
import { RefreshCw } from 'lucide-react';
import { usePageTitle } from '../../core/hooks/usePageTitle';

export const OfflinePage: React.FC = () => {
  usePageTitle('Offline — CivicPulse');

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans text-center">
      <div className="max-w-md w-full p-8 bg-white border border-neutral-200 rounded-lg shadow-subtle flex flex-col items-center space-y-4">
        <Illustration variant="offline" size="lg" />
        <h1 className="text-2xl font-bold text-neutral-900">Working Offline</h1>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Internet connection is unavailable. You can capture report drafts locally. They will sync automatically when connectivity is restored.
        </p>

        <Button variant="secondary" onClick={() => window.location.reload()} leadingIcon={<RefreshCw className="w-4 h-4" />}>
          Check Connection
        </Button>
      </div>
    </div>
  );
};
