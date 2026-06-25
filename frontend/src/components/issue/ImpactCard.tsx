import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import type { ImpactSummary, RiskLevel } from '@/api/types';
import { cn } from '@/lib/utils';

interface ImpactCardProps {
  impact: ImpactSummary;
  className?: string;
}

export const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const configs: Record<RiskLevel, { label: string; indicator: string; className: string }> = {
    low: {
      label: 'Low Risk',
      indicator: '▰▱▱',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-250',
    },
    moderate: {
      label: 'Moderate Risk',
      indicator: '▰▰▱',
      className: 'bg-amber-50 text-amber-700 border-amber-250',
    },
    high: {
      label: 'High Risk',
      indicator: '▰▰▰',
      className: 'bg-rose-50 text-rose-700 border-rose-250',
    },
  };

  const config = configs[level] || configs.low;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-small text-xs font-semibold border select-none font-sans',
        config.className
      )}
    >
      <AlertTriangle size={12} className="shrink-0" />
      <span>{config.label}</span>
      <span className="font-mono text-[10px] tracking-tight opacity-90">{config.indicator}</span>
    </span>
  );
};

export const ImpactCard: React.FC<ImpactCardProps> = ({ impact, className }) => {
  return (
    <div className={cn('border border-slate-100 bg-white rounded-large p-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-3.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-slate-50 text-slate-700 shrink-0">
            <ShieldAlert size={16} />
          </span>
          <span className="text-sm font-semibold text-slate-700 font-sans">Impact Assessment</span>
        </div>
        <RiskBadge level={impact.risk_level} />
      </div>

      {/* Details list */}
      <div className="space-y-4">
        {/* Affected Area Description */}
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Impacted Area
          </h4>
          <p className="text-sm text-slate-800 font-medium font-sans leading-tight">
            {impact.affected_area_description}
          </p>
        </div>

        {/* Potential Consequences */}
        <div className="space-y-1.5 pt-2 border-t border-slate-50">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Neighborhood Consequences
          </h4>
          <p className="text-xs text-slate-600 font-normal leading-relaxed font-sans">
            {impact.potential_consequences}
          </p>
        </div>

        {/* Evidence details row */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-50 text-[11px] text-slate-450 font-sans select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>
            Based on <strong className="text-slate-700 font-semibold">{impact.evidence_count} matching reports</strong> verified in this area.
          </span>
        </div>
      </div>
    </div>
  );
};
export default ImpactCard;
