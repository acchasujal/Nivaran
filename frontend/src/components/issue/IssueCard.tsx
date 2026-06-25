import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Layers, Eye, Sparkles } from 'lucide-react';
import type { Issue } from '@/api/types';
import { getImageUrl } from '@/utils/getImageUrl';
import { getLocalityName } from '@/utils/getLocalityName';
import { StatusBadge } from '../shared/StatusBadge';
import { cn } from '@/lib/utils';

interface IssueCardProps {
  issue: Issue;
  reportsCount: number;
  className?: string;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, reportsCount, className }) => {
  const [loaded, setLoaded] = useState(false);

  const humanizeIssueType = (type: string, desc = '') => {
    const d = desc.toLowerCase();
    if (d.includes('footpath') || d.includes('sidewalk')) return 'Broken Footpath';
    if (d.includes('dumping') || d.includes('debris') || d.includes('construction debris') || d.includes('illegal dumping')) return 'Illegal Dumping';
    if (d.includes('pothole') || d.includes('road damage') || d.includes('road surface')) return 'Road Damage';
    if (d.includes('streetlight') || d.includes('light') || d.includes('outage')) return 'Street Lighting';
    if (d.includes('leak') || d.includes('pipeline') || d.includes('water supply')) return 'Water Leakage';
    if (d.includes('garbage') || d.includes('waste') || d.includes('refuse') || d.includes('dump')) return 'Garbage Overflow';
    
    switch (type) {
      case 'road_damage': return 'Road Damage';
      case 'street_lighting': return 'Street Lighting';
      case 'water': return 'Water Leakage';
      case 'garbage': return 'Garbage Overflow';
      case 'footpath': return 'Broken Footpath';
      case 'dumping': return 'Illegal Dumping';
      default: return 'Other Civic Issue';
    }
  };

  const getIssueTypeBadgeColor = (type: string, desc = '') => {
    const title = humanizeIssueType(type, desc);
    switch (title) {
      case 'Road Damage': return 'bg-rose-600';
      case 'Street Lighting': return 'bg-amber-600';
      case 'Water Leakage': return 'bg-blue-600';
      case 'Garbage Overflow': return 'bg-purple-600';
      case 'Broken Footpath': return 'bg-teal-600';
      case 'Illegal Dumping': return 'bg-orange-600';
      default: return 'bg-slate-600';
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

  const getRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours <= 0) return 'Just now';
        return `${diffHours}h ago`;
      }
      if (diffDays === 1) return '1d ago';
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div
      className={cn(
        'group border border-slate-100 bg-white rounded-large overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative',
        className
      )}
    >
      {/* Photo Preview Container */}
      <div className="h-[230px] w-full bg-slate-50 relative overflow-hidden border-b border-slate-100 shrink-0">
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
            "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
            loaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none" />

        {/* Top-Left Overlays */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm", getIssueTypeBadgeColor(issue.issue_type, issue.description))}>
            {humanizeIssueType(issue.issue_type, issue.description)}
          </span>
          {issue.credibility_score >= 0.8 && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/85 text-emerald-400 border border-emerald-500/20 backdrop-blur-sm shadow-sm select-none">
              <Sparkles size={9} className="animate-pulse text-emerald-400 fill-emerald-400" />
              <span>AI Verified</span>
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
        <div className="space-y-3">
          {/* Header Row: Type and status */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-bold text-secondary-foreground font-sans leading-tight">
              {humanizeIssueType(issue.issue_type, issue.description)}
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
              <MapPin size={13} className="shrink-0 text-slate-400" />
              <span className="truncate max-w-[150px] font-medium text-slate-500">
                {getLocalityName(issue.latitude, issue.longitude)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={13} className="shrink-0 text-slate-400" />
              <span className="font-medium text-slate-500">{formatDate(issue.created_at)}</span>
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
                    idx < issue.severity ? getSeverityBg(issue.severity) : 'bg-slate-150'
                  )}
                />
              ))}
            </div>

            {/* Evidence reports count (human-friendly) */}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200/50 rounded-small px-2 py-0.5 select-none font-sans">
              <Layers size={10} className="shrink-0 text-slate-400" />
              <span>{reportsCount} Community {reportsCount === 1 ? 'Report' : 'Reports'}</span>
            </div>
          </div>

          {/* Navigate details link */}
          <Link
            to={`/issue/${issue.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover transition-colors font-sans"
          >
            <span>View Details</span>
            <Eye size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};
export default IssueCard;
