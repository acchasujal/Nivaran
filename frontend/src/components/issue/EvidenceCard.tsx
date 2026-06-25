import React from 'react';
import { Camera, AlertCircle } from 'lucide-react';
import type { Issue } from '@/api/types';
import { getStaticUrl } from '@/api/client';
import { cn } from '@/lib/utils';

interface EvidenceCardProps {
  issue: Issue;
  className?: string;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ issue, className }) => {
  const humanizeIssueType = (type: string) => {
    switch (type) {
      case 'road_damage': return 'Road Damage';
      case 'lighting': return 'Street Lighting';
      case 'water': return 'Water Supply / Leakage';
      case 'waste': return 'Waste / Garbage';
      default: return 'Other Civic Issue';
    }
  };

  const getSeverityColor = (sev: number) => {
    if (sev >= 4) return 'bg-rose-500 text-white';
    if (sev >= 3) return 'bg-amber-500 text-white';
    return 'bg-emerald-500 text-white';
  };

  return (
    <div className={cn('border border-slate-100 bg-white rounded-large overflow-hidden transition-all flex flex-col', className)}>
      {/* Evidence Photo - Large & Hero */}
      <div className="w-full h-80 md:h-[450px] relative bg-slate-50 overflow-hidden">
        <img
          src={getStaticUrl(issue.photo_url)}
          alt={humanizeIssueType(issue.issue_type)}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.01]"
        />
      </div>

      {/* Details Area */}
      <div className="p-6 md:p-8 space-y-6">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-slate-50 text-slate-700 shrink-0">
              <Camera size={16} />
            </span>
            <h3 className="text-xl font-bold text-secondary-foreground font-sans tracking-tight">
              {humanizeIssueType(issue.issue_type)}
            </h3>
          </div>
          
          {/* Severity block indicator */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Severity
            </span>
            {Array.from({ length: 5 }).map((_, idx) => {
              const step = idx + 1;
              const isActive = step <= issue.severity;
              return (
                <span
                  key={step}
                  className={cn(
                    'w-6 h-6 rounded-small flex items-center justify-center text-xs font-bold border transition-colors select-none',
                    isActive 
                      ? getSeverityColor(issue.severity)
                      : 'bg-slate-50 text-slate-350 border-slate-100'
                  )}
                >
                  {step}
                </span>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Image Analysis
          </h4>
          <p className="text-base text-slate-700 font-normal leading-relaxed font-sans">
            {issue.description}
          </p>
        </div>

        {/* User note if present */}
        {issue.user_note && (
          <div className="p-4 bg-slate-50 rounded-medium border border-slate-100/50">
            <h4 className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider mb-1">
              Reporter's Additional Note
            </h4>
            <p className="text-sm text-slate-650 font-normal font-sans italic leading-relaxed">
              "{issue.user_note}"
            </p>
          </div>
        )}

        {/* Credibility Score Banner (with required disclaimer label) */}
        <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-100 rounded-medium select-none animate-fade group">
          <AlertCircle size={15} className="text-slate-450 mt-0.5 shrink-0" />
          <div className="space-y-0.5 leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Analysis Confidence:
              </span>
              <span className="text-xs font-bold text-primary">
                {(issue.credibility_score * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-[10px] text-slate-450 font-normal leading-snug">
              Image quality and classification confidence (AI-assessed)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EvidenceCard;
