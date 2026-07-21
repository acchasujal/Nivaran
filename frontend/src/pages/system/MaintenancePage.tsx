import React from 'react';
import { Wrench } from 'lucide-react';
import { usePageTitle } from '../../core/hooks/usePageTitle';

export const MaintenancePage: React.FC = () => {
  usePageTitle('Scheduled Maintenance — CivicPulse');

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans text-center">
      <div className="max-w-md w-full p-8 bg-white border border-neutral-200 rounded-lg shadow-subtle flex flex-col items-center space-y-4">
        <div className="p-4 bg-amber-100 text-amber-900 rounded-pill">
          <Wrench className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Scheduled System Maintenance</h1>
        <p className="text-sm text-neutral-700 leading-relaxed">
          CivicPulse is undergoing scheduled database indexing and infrastructure updates. Please check back shortly.
        </p>
      </div>
    </div>
  );
};
