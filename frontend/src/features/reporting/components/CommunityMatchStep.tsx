import React, { useState } from 'react';
import { CommunityMatch } from '../../../design-system/patterns/community/CommunityMatch';
import { RadioGroup } from '../../../design-system/primitives/forms/RadioGroup';

export interface CommunityMatchStepProps {
  locality: string;
  onSelectOption: (choice: 'join' | 'new') => void;
}

export const CommunityMatchStep: React.FC<CommunityMatchStepProps> = ({ locality, onSelectOption }) => {
  const [choice, setChoice] = useState<'join' | 'new'>('new');

  const handleChange = (val: string) => {
    const c = val as 'join' | 'new';
    setChoice(c);
    onSelectOption(c);
  };

  return (
    <div className="space-y-4 font-sans">
      <CommunityMatch
        matchCount={3}
        locality={locality}
        explanation="3 nearby reports for road & drainage damage have been recorded within 100 meters of your location in the last 48 hours. Grouping increases municipal escalation priority."
      />

      <RadioGroup
        name="communityChoice"
        label="Choose Submission Mode:"
        value={choice}
        onChange={handleChange}
        options={[
          {
            value: 'new',
            label: 'Submit as New Independent Case',
            description: 'Creates a distinct tracking ID for your specific evidence photo and location.',
          },
          {
            value: 'join',
            label: 'Join Nearby Community Case Group (Recommended)',
            description: 'Appends your evidence photo to the active community case cluster for higher SLA urgency.',
          },
        ]}
      />
    </div>
  );
};
