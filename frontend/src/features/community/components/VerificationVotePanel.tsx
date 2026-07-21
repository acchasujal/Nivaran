import React, { useState } from 'react';
import { Surface } from '../../../design-system/primitives/foundation/Surface';
import { Progress } from '../../../design-system/primitives/feedback/Progress';
import { VerificationVote } from '../../../design-system/patterns/community/VerificationVote';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export interface VerificationVotePanelProps {
  caseId: string;
  confirmedCount?: number;
  unrepairedCount?: number;
  onVoteSubmit?: (vote: string) => void;
  className?: string;
}

export const VerificationVotePanel: React.FC<VerificationVotePanelProps> = ({
  caseId,
  confirmedCount = 14,
  unrepairedCount = 2,
  onVoteSubmit,
  className,
}) => {
  const [userVoted, setUserVoted] = useState(false);
  const totalVotes = confirmedCount + unrepairedCount;
  const consensusPercent = Math.round((confirmedCount / totalVotes) * 100);

  const handleVote = (vote: string) => {
    if (onVoteSubmit) onVoteSubmit(vote);
    setUserVoted(true);
  };

  return (
    <div className={`space-y-4 font-sans ${className || ''}`}>
      <Surface variant="card" className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2 text-success font-semibold">
            <ShieldCheck className="w-5 h-5 text-primary-700" />
            <h3 className="text-base text-neutral-900">Community Factual Verification & Consensus Audit</h3>
          </div>

          <span className="text-xs font-mono font-bold text-success bg-green-100 px-2.5 py-1 rounded-pill">
            {consensusPercent}% Community Consensus
          </span>
        </div>

        {/* Consensus Meter */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-neutral-900">
            <span>Physical Site Audit Agreement Rate</span>
            <span>{confirmedCount} Confirmed vs {unrepairedCount} Contested</span>
          </div>
          <Progress value={consensusPercent} showPercentage label="Verification Consensus Rate" />
        </div>

        {/* Voting Interface */}
        {!userVoted ? (
          <VerificationVote caseId={caseId} onVoteSubmit={handleVote} />
        ) : (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-xs text-neutral-900">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <span>Thank you! Your physical verification vote has been registered on the public audit ledger.</span>
          </div>
        )}
      </Surface>
    </div>
  );
};
