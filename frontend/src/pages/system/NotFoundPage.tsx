import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Illustration } from '../../design-system/primitives/foundation/Illustration';
import { Button } from '../../design-system/primitives/buttons/Button';
import { Home } from 'lucide-react';
import { usePageTitle } from '../../core/hooks/usePageTitle';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  usePageTitle('404 — Page Not Found');

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans text-center">
      <div className="max-w-md w-full p-8 bg-white border border-neutral-200 rounded-lg shadow-subtle flex flex-col items-center space-y-4">
        <Illustration variant="empty" size="lg" />
        <span className="text-xs font-mono font-bold text-primary-700 bg-primary-500/10 px-2 py-0.5 rounded-sm">
          ERROR 404
        </span>
        <h1 className="text-2xl font-bold text-neutral-900">Page Not Found</h1>
        <p className="text-sm text-neutral-700 leading-relaxed">
          The civic route or case ID you requested does not exist or has been relocated.
        </p>

        <Button variant="primary" onClick={() => navigate('/')} leadingIcon={<Home className="w-4 h-4" />}>
          Return to Home Feed
        </Button>
      </div>
    </div>
  );
};
