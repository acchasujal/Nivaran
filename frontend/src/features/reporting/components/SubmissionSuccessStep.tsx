import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '../../../design-system/primitives/buttons/Button';
import { Surface } from '../../../design-system/primitives/foundation/Surface';

export interface SubmissionSuccessStepProps {
  caseId: string;
  onTrackCase: () => void;
}

export const SubmissionSuccessStep: React.FC<SubmissionSuccessStepProps> = ({ caseId, onTrackCase }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/issue/${caseId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans text-center py-4">
      <div className="flex flex-col items-center space-y-3">
        <div className="p-4 bg-green-100 rounded-pill text-success animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900">Civic Report Dispatched!</h2>
        <p className="text-sm text-neutral-700 max-w-md leading-relaxed">
          Your evidence photo and location have been registered into the public accountability ledger.
        </p>
      </div>

      <Surface variant="card" elevation={1} className="p-6 max-w-md mx-auto space-y-3 bg-gradient-to-b from-white to-neutral-50">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700">Official Tracking Case ID</span>
        <div className="text-3xl font-mono font-bold text-primary-700">{caseId}</div>

        <div className="pt-3 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            leadingIcon={copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Link Copied!' : 'Copy Case Link'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onTrackCase}
            leadingIcon={<ExternalLink className="w-4 h-4" />}
          >
            View Live Tracking
          </Button>
        </div>
      </Surface>
    </div>
  );
};
