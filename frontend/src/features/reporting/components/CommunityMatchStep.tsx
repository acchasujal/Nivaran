import React from 'react';
import { CommunityMatch } from '../../../design-system/patterns/community/CommunityMatch';
import { RadioGroup } from '../../../design-system/primitives/forms/RadioGroup';

export interface CommunityMatchStepProps {
  locality: string;
  matchCount?: number;
  selectedChoice?: 'join' | 'new';
  onSelectOption: (choice: 'join' | 'new') => void;
}

export const CommunityMatchStep: React.FC<CommunityMatchStepProps> = ({
  locality,
  matchCount,
  selectedChoice = 'join',
  onSelectOption,
}) => {
  const handleChange = (val: string) => {
    onSelectOption(val as 'join' | 'new');
  };

  return (
    <div className="space-y-4 font-sans">
      <CommunityMatch
        matchCount={matchCount}
        locality={locality || 'Nearby Area'}
        explanation={matchCount
          ? `${matchCount} nearby reports may belong to the same local issue.`
          : 'Nearby reports will be checked when this report is submitted. You can choose to keep this evidence as a separate case.'}
      />

      <RadioGroup
        name="communityChoice"
        label="Choose Submission Mode:"
        value={selectedChoice}
        onChange={handleChange}
        options={[
          {
            value: 'join',
            label: 'Check for a Nearby Community Case (Recommended)',
            description: 'Nivaran will check for a matching case after submission and merge the evidence only when the reports are sufficiently similar.',
          },
          {
            value: 'new',
            label: 'Keep This as an Independent Case',
            description: 'Creates a distinct case and skips community clustering for this submission.',
          },
        ]}
      />
    </div>
  );
};
