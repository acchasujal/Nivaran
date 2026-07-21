import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../../design-system/primitives/buttons/Button';
import { usePageTitle } from '../../core/hooks/usePageTitle';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  usePageTitle('403 — Access Restricted');

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans text-center">
      <div className="max-w-md w-full p-8 bg-white border border-neutral-200 rounded-lg shadow-subtle flex flex-col items-center space-y-4">
        <div className="p-4 bg-red-100 rounded-pill text-danger">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <span className="text-xs font-mono font-bold text-danger bg-red-100 px-2 py-0.5 rounded-sm">
          ERROR 403 — ACCESS RESTRICTED
        </span>
        <h1 className="text-2xl font-bold text-neutral-900">Official Authorization Required</h1>
        <p className="text-sm text-neutral-700 leading-relaxed">
          This portal section requires executive institutional credentials or specific role privileges.
        </p>

        <Button variant="secondary" onClick={() => navigate(-1)} leadingIcon={<ArrowLeft className="w-4 h-4" />}>
          Go Back
        </Button>
      </div>
    </div>
  );
};
