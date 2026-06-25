import React, { useState } from 'react';
import { Camera, AlertCircle, MapPin } from 'lucide-react';
import type { Issue } from '@/api/types';
import { getImageUrl } from '@/utils/getImageUrl';
import { getLocalityName } from '@/utils/getLocalityName';
import { cn } from '@/lib/utils';

interface EvidenceCardProps {
  issue: Issue;
  className?: string;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ issue, className }) => {
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

  const getSeverityColor = (sev: number) => {
    if (sev >= 4) return 'bg-rose-500 text-white';
    if (sev >= 3) return 'bg-amber-500 text-white';
    return 'bg-emerald-500 text-white';
  };

  return (
    <div className={cn('border border-slate-100 bg-white rounded-large overflow-hidden transition-all flex flex-col', className)}>
      {/* Evidence Photo - Large & Hero */}
      <div className="w-full h-80 md:h-[450px] relative bg-slate-50 overflow-hidden shrink-0">
        {!loaded && (
          <div className="absolute inset-0 bg-slate-200/80 animate-pulse flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-primary animate-spin" />
          </div>
        )}
        <img
          src={getImageUrl(issue.photo_url)}
          alt={humanizeIssueType(issue.issue_type, issue.description)}
          className={cn(
            "w-full h-full object-cover transition-all duration-500 hover:scale-[1.01]",
            loaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          loading="lazy"
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
              {humanizeIssueType(issue.issue_type, issue.description)}
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

        {/* GPS location and Locality metadata row */}
        <div className="flex items-center gap-2 py-2 px-3 bg-slate-50 border border-slate-100 rounded-medium text-xs text-slate-500 font-sans">
          <MapPin size={14} className="text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-700">{getLocalityName(issue.latitude, issue.longitude)}</span>
          <span className="text-slate-350 select-none">•</span>
          <span className="font-mono text-slate-500 font-medium select-all">GPS: {issue.latitude.toFixed(6)}, {issue.longitude.toFixed(6)}</span>
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
