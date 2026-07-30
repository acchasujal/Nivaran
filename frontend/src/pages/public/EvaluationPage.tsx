import React from 'react';
import { usePageTitle } from '../../core/hooks/usePageTitle';
import { EvaluationWorkspace } from '../../features/admin/components/EvaluationWorkspace';

export const EvaluationPage: React.FC = () => {
  usePageTitle('Hackathon Judge Evaluation Mode — Nivaran');

  return (
    <div className="space-y-6 font-sans py-2">
      <EvaluationWorkspace />
    </div>
  );
};

export default EvaluationPage;
