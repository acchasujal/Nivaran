import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Layers, Eye, Sparkles } from 'lucide-react';
import type { Issue } from '@/api/types';
import { getImageUrl } from '@/utils/getImageUrl';
import { getLocalityName } from '@/utils/getLocalityName';
import { StatusBadge } from '../shared/StatusBadge';
import {
  humanizeIssueType,
  getIssueTypeBadgeColor,
  getSeverityBg,
  formatDateOnly,
  getRelativeTime,
} from '@/utils/issueHelpers';
import { cn } from '@/lib/utils';

interface IssueCardProps {
  issue: Issue;
  reportsCount: number;
  className?: string;
}

export const IssueCardComponent: React.FC<IssueCardProps> = ({ issue, reportsCount, className }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={cn(
        'group border border-slate-200/80 bg-white rounded-medium overflow-hidden shadow-subtle hover:shadow-premium hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full relative',
        className
      )}
    >
      {/* Photo Preview Container */}
      <div className="h-[200px] w-full bg-slate-50 relative overflow-hidden border-b border-slate-100 shrink-0">
        {/* Loading skeleton */}
        {!loaded && (
          <div className="absolute inset-0 bg-slate-200/80 animate-pulse flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-primary animate-spin" />
          </div>
        )}

        <img
          src={getImageUrl(issue.photo_url)}
          alt={humanizeIssueType(issue.issue_type, issue.description)}
          className={cn(
            "w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02]",
            loaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent pointer-events-none" />

        {/* Top-Left Overlays */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm border", getIssueTypeBadgeColor(issue.issue_type, issue.description))}>
            {humanizeIssueType(issue.issue_type, issue.description)}
          </span>
          {issue.credibility_score >= 0.8 && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/90 text-teal-400 border border-teal-500/20 backdrop-blur-sm shadow-sm select-none"
              title="Image quality and classification confidence (AI-assessed)"
            >
              <Sparkles size={9} className="text-teal-400 fill-teal-400" />
              <span>AI Verified ({Math.round(issue.credibility_score * 100)}%)</span>
            </span>
          )}
        </div>

        {/* Bottom-Right Overlay */}
        <div className="absolute bottom-3 right-3 z-10">
          <span className="px-2 py-0.5 rounded-small text-[10px] font-semibold bg-slate-950/70 text-slate-100 backdrop-blur-sm select-none">
            {getRelativeTime(issue.created_at)}
          </span>
        </div>
      </div>

      {/* Card Details Content */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-2.5">
          {/* Header Row: Type and status */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-bold text-secondary-foreground font-sans leading-tight">
              {humanizeIssueType(issue.issue_type, issue.description)}
            </h3>
            <StatusBadge status={issue.status} className="shrink-0 scale-90 origin-right" />
          </div>

          {/* Description Preview */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-sans font-normal">
            {issue.description || 'No description provided.'}
          </p>

          {/* Metadata Row: GPS Location and Date */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-[11px] text-slate-400 font-sans">
            <div className="flex items-center gap-1">
              <MapPin size={13} className="shrink-0 text-slate-400" />
              <span className="truncate max-w-[140px] font-medium text-slate-500">
                {getLocalityName(issue.latitude, issue.longitude)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={13} className="shrink-0 text-slate-400" />
              <span className="font-medium text-slate-500">{formatDateOnly(issue.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Action and Metric Row */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
          {/* Reports Match and Severity Dots */}
          <div className="flex items-center gap-3">
            {/* Severity Indicator dots */}
            <div className="flex items-center gap-1" title={`Severity ${issue.severity}/5`}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-colors',
                    idx < issue.severity ? getSeverityBg(issue.severity) : 'bg-slate-200'
                  )}
                />
              ))}
            </div>

            {/* Evidence reports count (human-friendly) */}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-650 bg-slate-50 border border-slate-200/50 rounded-small px-2 py-0.5 select-none font-sans">
              <Layers size={10} className="shrink-0 text-slate-400" />
              <span>{reportsCount} {reportsCount === 1 ? 'Report' : 'Reports'}</span>
            </div>
          </div>

          {/* Navigate details link */}
          <Link
            to={`/issue/${issue.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover transition-colors font-sans"
          >
            <span>View Case</span>
            <Eye size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export const IssueCard = React.memo(IssueCardComponent);
export default IssueCard;
