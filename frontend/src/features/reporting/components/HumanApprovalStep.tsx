import React, { useState } from 'react';
import { Surface } from '../../../design-system/primitives/foundation/Surface';
import { Checkbox } from '../../../design-system/primitives/forms/Checkbox';
import { FileText } from 'lucide-react';
import type { IssueType } from '../../../api/types';

export interface HumanApprovalStepProps {
  issueType: IssueType;
  locality: string;
  userNote: string;
  onConsentChange: (consented: boolean) => void;
}

export const HumanApprovalStep: React.FC<HumanApprovalStepProps> = ({
  issueType,
  locality,
  userNote,
  onConsentChange,
}) => {
  const [consented, setConsented] = useState(false);

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setConsented(val);
    onConsentChange(val);
  };

  return (
    <div className="space-y-4 font-sans">
      <Surface variant="card" elevation={1} className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-primary-700 font-semibold border-b border-neutral-100 pb-2">
          <FileText className="w-5 h-5" />
          <h4 className="text-base text-neutral-900">Review Your Evidence Before Submission</h4>
        </div>

        <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200 text-xs leading-relaxed space-y-2">
          <p className="font-semibold text-neutral-900">REPORT FOR YOUR REVIEW</p>
          <p>
            Target Category: <strong className="uppercase">{issueType.replace('_', ' ')}</strong> | Location: <strong>{locality}</strong>
          </p>
          <p>
            "This report contains your evidence and description of a possible public issue. Review the details before submitting it for server-side evidence review. Any municipal action draft will be generated later, if the evidence is sufficiently corroborated, and will require separate approval."
          </p>
          {userNote && <p className="italic text-neutral-700">Citizen note: "{userNote}"</p>}
        </div>

        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <Checkbox
            id="human-approval-ack"
            label="I confirm that I have reviewed my evidence and want to submit this report for review."
            checked={consented}
            onChange={handleCheckbox}
          />
        </div>
      </Surface>
    </div>
  );
};
