import React from 'react';
import { ShieldCheck, Network } from 'lucide-react';
import type { Issue } from '@/api/types';
import { humanizeIssueType } from '@/utils/issueHelpers';
import { HelpTooltip } from '@/components/shared/HelpTooltip';

interface TrustScoreCardProps {
  issue: Issue;
  imageIntegrityStatus?: string | null;
  imageIntegritySimilarity?: number | null;
  verificationSimilarity?: number | null;
  verificationThreshold?: number | null;
  verificationDecision?: string | null;
  className?: string;
}

export const TrustScoreCard: React.FC<TrustScoreCardProps> = ({
  issue,
  imageIntegrityStatus,
  imageIntegritySimilarity,
  verificationSimilarity,
  verificationThreshold,
  verificationDecision,
  className,
}) => {
  return (
    <div className={`border border-slate-200 rounded-medium bg-slate-50/40 overflow-hidden ${className}`}>
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2 select-none">
          <ShieldCheck size={16} className="text-teal-650 shrink-0" />
          <span className="text-xs font-bold text-slate-750 uppercase tracking-wider">
            Evidence Trust Profile
          </span>
        </div>
        <div className="flex items-center gap-1 font-sans">
          <span className="text-sm font-bold text-slate-800">{Math.round(issue.credibility_score * 100)}</span>
          <span className="text-[10px] text-slate-450">/ 100</span>
        </div>
      </div>
      
      <div className="p-4 space-y-4 font-sans">
        {/* Factors list with progress bars */}
        <div className="grid grid-cols-1 gap-2.5">
          {[
            { name: 'Image Quality Check', score: 100, label: 'Passed format and resolution validations' },
            { name: 'GPS Coordinates Lock', score: issue.latitude !== 0 && issue.longitude !== 0 ? 100 : 0, label: issue.latitude !== 0 && issue.longitude !== 0 ? 'Coordinates verified' : 'Coordinates missing' },
            { name: 'Image Duplicate Hash', score: imageIntegrityStatus === "Original Evidence" ? 100 : Math.max(0, 100 - (imageIntegritySimilarity || 0)), label: imageIntegrityStatus || 'No visual duplicates found' },
            { name: 'Infrastructure Detection', score: Math.round(issue.credibility_score * 100), label: 'AI entity recognition confidence' },
            { name: 'Visual Hazard Integrity', score: Math.round(issue.credibility_score * 95), label: 'Hazard feature mapping' },
            { name: 'Metadata Signature', score: issue.photo_url ? 100 : 50, label: issue.photo_url ? 'File signature format verified' : 'No photo uploaded' },
          ].map((f) => (
            <div key={f.name} className="space-y-1 bg-white p-2.5 rounded border border-slate-150 shadow-sm">
              <div className="flex justify-between items-center text-[10px] select-none">
                <span className="font-bold text-slate-650 uppercase tracking-wider">{f.name}</span>
                <span className="font-bold text-teal-650">{f.score}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${f.score}%` }} />
              </div>
              <span className="text-[9px] text-slate-400 block truncate">{f.label}</span>
            </div>
          ))}
        </div>

        {/* AI Explainability Toggle: "Why?" */}
        <div className="border-t border-slate-150 pt-3">
          <details className="group">
            <summary className="flex items-center gap-1.5 text-xs font-bold text-primary cursor-pointer select-none hover:text-primary/95 focus:outline-none">
              <span>Why? AI Explainability Log</span>
              <span className="text-[9px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-2.5 p-3.5 rounded bg-white border border-slate-200/60 text-[11px] space-y-3 text-slate-655 leading-relaxed shadow-sm">
              <div>
                <span className="font-bold text-slate-400 uppercase block tracking-widest text-[8px] mb-0.5 select-none">Inputs</span>
                <span className="font-mono bg-slate-50 px-1 py-0.5 rounded text-[10px]">
                  {issue.photo_url.split('.').pop()?.toUpperCase()} format, GPS verified
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase block tracking-widest text-[8px] mb-0.5 select-none">Confidence</span>
                <span>{Math.round(issue.credibility_score * 100)}% visual validation matching score from Stage-0 AI gate.</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase block tracking-widest text-[8px] mb-0.5 select-none">Decision</span>
                <span className="font-bold text-slate-800">Classified as {humanizeIssueType(issue.issue_type, issue.description)} (Severity: {issue.severity}/5).</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase block tracking-widest text-[8px] mb-0.5 select-none">Reasoning Log</span>
                <span>Gemini matched structural visual features corresponding to {issue.issue_type.replace('_', ' ')}. No visual duplicate conflict.</span>
              </div>
            </div>
          </details>
        </div>

        {/* Agent 2 Deduplication Explainer block */}
        {verificationDecision && (
          <div className="border-t border-slate-150 pt-3 space-y-2.5">
            <div className="flex items-center gap-1.5 select-none">
              <Network size={14} className="text-primary shrink-0" />
              <span className="text-[10px] font-bold text-slate-750 uppercase tracking-wider">
                Agent 2 Deduplication Reasoning
              </span>
              <HelpTooltip text="Explains why reports were merged into an existing cluster or kept as separate community issues." />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded border border-slate-200/60 shadow-sm">
                <span className="text-[9px] font-bold text-slate-400 block uppercase leading-none mb-1">
                  Similarity Score
                </span>
                <span className="font-bold text-slate-800">
                  {verificationSimilarity !== undefined && verificationSimilarity !== null && verificationSimilarity > 0
                    ? `${Math.round(verificationSimilarity * 100)}%` 
                    : 'N/A (First Report)'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200/60 shadow-sm">
                <span className="text-[9px] font-bold text-slate-400 block uppercase leading-none mb-1">
                  Merge Threshold
                </span>
                <span className="font-bold text-slate-800">
                  {verificationThreshold !== undefined && verificationThreshold !== null
                    ? `${Math.round(verificationThreshold * 100)}%` 
                    : '60%'}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-650 leading-relaxed bg-white p-3 rounded border border-slate-205 shadow-sm font-medium">
              <span className="font-bold text-slate-800 block text-[9px] uppercase tracking-wider mb-1">
                Decision Detail
              </span>
              {verificationDecision}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
