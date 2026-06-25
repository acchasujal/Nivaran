import React from 'react';
import { ShieldAlert, AlertTriangle, FileCheck } from 'lucide-react';
import type { ImpactSummary, RiskLevel } from '@/api/types';
import { cn } from '@/lib/utils';

interface ImpactCardProps {
  impact: ImpactSummary;
  className?: string;
}

export const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const configs: Record<RiskLevel, { label: string; className: string }> = {
    low: {
      label: 'Low Risk',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    moderate: {
      label: 'Moderate Risk',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    high: {
      label: 'High Risk',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  };

  const config = configs[level] || configs.low;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-small text-xs font-semibold border select-none font-sans',
        config.className
      )}
    >
      <AlertTriangle size={12} className="mr-1.5 shrink-0" />
      {config.label}
    </span>
  );
};

export const ImpactCard: React.FC<ImpactCardProps> = ({ impact, className }) => {
  return (
    <div className={cn('border border-secondary-border bg-white rounded-large p-6 shadow-subtle space-y-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-secondary-border pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-amber-50 text-amber-700 shrink-0">
            <ShieldAlert size={16} />
          </span>
          <span className="text-sm font-semibold text-slate-700 font-sans">Neighborhood Impact</span>
        </div>
        
        {/* Risk Badge */}
        <RiskBadge level={impact.risk_level} />
      </div>

      {/* Details list */}
      <div className="space-y-4">
        {/* Affected Area Description */}
        <div className="space-y-1">
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Scope of Impacted Area
          </h4>
          <p className="text-sm text-secondary-foreground font-medium font-sans leading-tight">
            {impact.affected_area_description}
          </p>
        </div>

        {/* Potential Consequences */}
        <div className="space-y-1">
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Potential Safety & Structural Consequences
          </h4>
          <p className="text-xs text-slate-600 font-normal leading-relaxed font-sans">
            {impact.potential_consequences}
          </p>
        </div>

        {/* Evidence details row */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-small text-xs text-slate-500 font-sans">
          <FileCheck size={14} className="text-indigo-500 shrink-0" />
          <span>
            Aggregated from <strong className="text-slate-700">{impact.evidence_count} verified citizen reports</strong> collected nearby.
          </span>
        </div>
      </div>
    </div>
  );
};
export default ImpactCard;
