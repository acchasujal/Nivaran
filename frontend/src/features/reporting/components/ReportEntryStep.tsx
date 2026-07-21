import React from 'react';
import { Select } from '../../../design-system/primitives/forms/Select';
import { Textarea } from '../../../design-system/primitives/forms/Textarea';
import type { IssueType } from '../../../api/types';

export interface ReportEntryStepProps {
  issueType: IssueType;
  userNote: string;
  onChangeIssueType: (type: IssueType) => void;
  onChangeUserNote: (note: string) => void;
}

const CATEGORY_OPTIONS = [
  { value: 'road_damage', label: 'Road Damage / Pothole / Asphalt' },
  { value: 'water', label: 'Water Leakage / Pipe Burst / Contamination' },
  { value: 'garbage', label: 'Uncollected Garbage / Waste Overflow' },
  { value: 'street_lighting', label: 'Street Light Outage / Dark Corridor' },
  { value: 'footpath', label: 'Broken Footpath / Pedestrian Obstruction' },
  { value: 'dumping', label: 'Illegal Debris Dumping' },
];

export const ReportEntryStep: React.FC<ReportEntryStepProps> = ({
  issueType,
  userNote,
  onChangeIssueType,
  onChangeUserNote,
}) => {
  return (
    <div className="space-y-4 font-sans">
      <Select
        name="issueCategory"
        label="Select Issue Category"
        description="Choose the primary public hazard type for initial classification"
        value={issueType}
        onChange={(e) => onChangeIssueType(e.target.value as IssueType)}
        options={CATEGORY_OPTIONS}
        required
      />

      <Textarea
        name="userNote"
        label="Citizen Observation / Notes (Optional)"
        description="Provide relevant details, duration, or landmark cues"
        value={userNote}
        onChange={(e) => onChangeUserNote(e.target.value)}
        placeholder="e.g., Deep pothole near main traffic intersection, expanding since last rain..."
        rows={3}
        maxLength={300}
        showCharacterCount
      />
    </div>
  );
};
