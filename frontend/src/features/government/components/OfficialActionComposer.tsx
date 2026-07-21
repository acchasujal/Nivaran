import React, { useState } from 'react';
import { Surface } from '../../../design-system/primitives/foundation/Surface';
import { Select } from '../../../design-system/primitives/forms/Select';
import { Textarea } from '../../../design-system/primitives/forms/Textarea';
import { Button } from '../../../design-system/primitives/buttons/Button';
import { Send, CheckCircle2, UserCheck } from 'lucide-react';

export interface OfficialActionComposerProps {
  caseId: string;
  onActionSubmit: (action: 'acknowledge' | 'assign' | 'response', details: any) => void;
  className?: string;
}

const OFFICER_LIST = [
  { value: 'officer-verma', label: 'Executive Officer R. Verma' },
  { value: 'officer-sharma', label: 'Inspector S. Sharma' },
  { value: 'officer-gupta', label: 'Senior Engineer A. Gupta' },
];

export const OfficialActionComposer: React.FC<OfficialActionComposerProps> = ({
  caseId,
  onActionSubmit,
  className,
}) => {
  const [officer, setOfficer] = useState('officer-verma');
  const [responseText, setResponseText] = useState('');

  return (
    <Surface variant="card" className={`p-6 space-y-4 font-sans ${className || ''}`}>
      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
        <h3 className="text-base font-semibold text-neutral-900">
          Executive Officer Action Console — Case #{caseId}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          name="assignOfficer"
          label="Assign Duty Officer"
          value={officer}
          onChange={(e) => setOfficer(e.target.value)}
          options={OFFICER_LIST}
        />

        <div className="flex items-end gap-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => onActionSubmit('acknowledge', { caseId })}
            leadingIcon={<CheckCircle2 className="w-4 h-4 text-success" />}
          >
            Acknowledge Receipt
          </Button>

          <Button
            variant="primary"
            fullWidth
            onClick={() => onActionSubmit('assign', { caseId, officer })}
            leadingIcon={<UserCheck className="w-4 h-4" />}
          >
            Assign Officer
          </Button>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-neutral-100">
        <Textarea
          name="officialResponse"
          label="Publish Official Municipal Response / Public Directive"
          placeholder="Enter official statement, inspection timeline, or contractor dispatch instructions..."
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          rows={3}
        />

        <div className="flex justify-end">
          <Button
            variant="primary"
            disabled={!responseText.trim()}
            onClick={() => onActionSubmit('response', { caseId, responseText })}
            leadingIcon={<Send className="w-4 h-4" />}
          >
            Publish Response to Timeline
          </Button>
        </div>
      </div>
    </Surface>
  );
};
