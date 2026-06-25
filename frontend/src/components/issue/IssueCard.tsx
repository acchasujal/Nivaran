import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Layers, Eye } from 'lucide-react';
import type { Issue } from '@/api/types';
import { getStaticUrl } from '@/api/client';
import { StatusBadge } from '../shared/StatusBadge';
import { cn } from '@/lib/utils';

interface IssueCardProps {
  issue: Issue;
  reportsCount: number;
  className?: string;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, reportsCount, className }) => {
  const humanizeIssueType = (type: string) => {
    switch (type) {
      case 'road_damage': return 'Road Damage';
      case 'lighting': return 'Street Lighting';
      case 'water': return 'Water Supply / Leakage';
      case 'waste': return 'Waste / Garbage';
      default: return 'Other Civic Issue';
    }
  };

  const getSeverityBg = (sev: number) => {
    if (sev >= 4) return 'bg-rose-500';
    if (sev >= 3) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div
      className={cn(
        'group border border-secondary-border bg-white rounded-large overflow-hidden hover:shadow-subtle hover:border-slate-300 transition-all duration-200 flex flex-col h-full relative',
        className
      )}
    >
      {/* Top Banner Tag: Self-Reported */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 backdrop-blur-sm rounded-small text-[10px] font-bold text-white uppercase tracking-wider select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
        <span>Self-Reported</span>
      </div>

      {/* Photo Preview Container */}
      <div className="h-44 w-full bg-slate-50 relative overflow-hidden border-b border-slate-100 shrink-0">
        <img
          src={getStaticUrl(issue.photo_url)}
          alt={humanizeIssueType(issue.issue_type)}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none" />
      </div>

      {/* Card Details Content */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-3">
          {/* Header Row: Type and status */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-bold text-secondary-foreground font-sans leading-tight">
              {humanizeIssueType(issue.issue_type)}
            </h3>
            <StatusBadge status={issue.status} className="shrink-0 scale-95 origin-right" />
          </div>

          {/* Description Preview */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-sans font-normal">
            {issue.description || 'No description provided.'}
          </p>

          {/* Metadata Row: GPS Location and Date */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-slate-400 font-sans">
            <div className="flex items-center gap-1">
              <MapPin size={13} className="shrink-0" />
              <span className="truncate max-w-[120px]">
                {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={13} className="shrink-0" />
              <span>{formatDate(issue.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Action and Metric Row */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
          {/* Reports Match and Severity Dots */}
          <div className="flex items-center gap-3">
            {/* Severity Indicator dots */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-colors',
                    idx < issue.severity ? getSeverityBg(issue.severity) : 'bg-slate-150'
                  )}
                  title={`Severity ${issue.severity}/5`}
                />
              ))}
            </div>

            {/* Evidence reports count (human-friendly: reports collected) */}
            <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50/70 border border-indigo-100/50 rounded-small px-2 py-0.5 select-none font-sans">
              <Layers size={11} className="shrink-0" />
              <span>{reportsCount} {reportsCount === 1 ? 'Report' : 'Reports'} Collected</span>
            </div>
          </div>

          {/* Navigate details link */}
          <Link
            to={`/issue/${issue.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover transition-colors font-sans"
          >
            <span>View details</span>
            <Eye size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};
export default IssueCard;
