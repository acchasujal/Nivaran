import React from 'react';
import { StatusChip } from '../../../design-system/composites/status/StatusChip';
import type { IssueType } from '../../../api/types';

export interface AISummaryStepProps {
  issueType: IssueType;
  userNote: string;
}

export const AISummaryStep: React.FC<AISummaryStepProps> = ({ issueType, userNote }) => {
  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-neutral-900">AI Perception & Classification</h4>
        <StatusChip category="ai" label="Machine Analysis" />
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-neutral-900">Analysis runs after submission</p>
        <p className="mt-1 text-sm leading-relaxed text-neutral-700">
          Nivaran will review the uploaded evidence on the server after you submit. The returned issue type,
          confidence, severity, and explanation will appear on the case timeline; no result is shown here before
          the evidence has been processed.
        </p>
        <p className="mt-2 text-xs text-neutral-600">
          Selected category: <span className="font-medium">{issueType.replace('_', ' ')}</span>
          {userNote ? ' · Your note will be included in the review.' : ''}
        </p>
      </div>
    </div>
  );
};
