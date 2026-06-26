import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import type { ImpactSummary, RiskLevel } from '@/api/types';
import { cn } from '@/lib/utils';

interface ImpactCardProps {
  impact: ImpactSummary;
  className?: string;
}

export const RiskBadgeComponent: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const configs: Record<RiskLevel, { label: string; indicator: string; className: string }> = {
    low: {
      label: 'Low Impact Risk',
      indicator: '▰▱▱',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-250',
    },
    moderate: {
      label: 'Moderate Impact Risk',
      indicator: '▰▰▱',
      className: 'bg-amber-50 text-amber-700 border-amber-250',
    },
    high: {
      label: 'Critical Impact Risk',
      indicator: '▰▰▰',
      className: 'bg-rose-50 text-rose-700 border-rose-250',
    },
  };

  const config = configs[level] || configs.low;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-small text-xs font-semibold border select-none font-sans',
        config.className
      )}
    >
      <AlertTriangle size={12} className="shrink-0" />
      <span>{config.label}</span>
      <span className="font-mono text-[10px] tracking-tight opacity-90">{config.indicator}</span>
    </span>
  );
};

export const RiskBadge = React.memo(RiskBadgeComponent);

export const ImpactCardComponent: React.FC<ImpactCardProps> = ({ impact, className }) => {
  return (
    <div className={cn('border border-slate-200 bg-white rounded-medium p-6 space-y-5 shadow-subtle', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-slate-50 text-slate-700 shrink-0 border border-slate-100">
            <ShieldAlert size={16} />
          </span>
          <span className="text-xs font-bold text-slate-700 font-sans uppercase tracking-wider">Impact Intelligence</span>
        </div>
        <RiskBadge level={impact.risk_level} />
      </div>

      {/* Details list */}
      <div className="space-y-4">
        {/* Affected Area Description */}
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Spatial Assessment Zone
          </h4>
          <p className="text-sm text-slate-800 font-semibold font-sans leading-tight">
            {impact.affected_area_description}
          </p>
        </div>

        {/* Potential Consequences */}
        <div className="space-y-1.5 pt-3 border-t border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Municipal & Community Consequences
          </h4>
          <p className="text-xs text-slate-600 font-normal leading-relaxed font-sans">
            {impact.potential_consequences}
          </p>
        </div>

        {/* Evidence details row */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-450 font-sans select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
          <span>
            Based on <strong className="text-slate-700 font-bold">{impact.evidence_count} matching reports</strong> verified in this area.
          </span>
        </div>
      </div>
    </div>
  );
};

export const ImpactCard = React.memo(ImpactCardComponent);
export default ImpactCard;
