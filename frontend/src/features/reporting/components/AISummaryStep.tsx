import React from 'react';
import { AIEvent } from '../../../design-system/composites/timeline/AIEvent';
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

      <AIEvent
        claim={`Classified as ${issueType.replace('_', ' ').toUpperCase()}`}
        confidencePercent={94}
        timestamp="Just now"
        explanation={`Automated inference detected visual cues matching municipal ${issueType.replace('_', ' ')} specifications. Severity evaluated as Moderate (Level 3/5). ${
          userNote ? `Citizen note incorporated: "${userNote}"` : ''
        }`}
      />
    </div>
  );
};
