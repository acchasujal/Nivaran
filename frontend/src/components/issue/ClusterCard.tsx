import React from 'react';
import { Layers, Calendar, MapPin, Hash } from 'lucide-react';
import type { Cluster } from '@/api/types';
import { cn } from '@/lib/utils';

interface ClusterCardProps {
  cluster: Cluster;
  className?: string;
}

export const ClusterCard: React.FC<ClusterCardProps> = ({ cluster, className }) => {
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className={cn('border border-secondary-border bg-white rounded-large p-6 shadow-subtle space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-secondary-border pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-indigo-50 text-indigo-700 shrink-0">
            <Layers size={16} />
          </span>
          <span className="text-sm font-semibold text-slate-700 font-sans">Nearby Reports Location</span>
        </div>
        
        {/* Count badge */}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
          <Hash size={12} />
          <span>{cluster.report_count} Reports Collected</span>
        </span>
      </div>

      {/* Main Details */}
      <div className="space-y-3">
        <div className="space-y-0.5">
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Identified Proximity Area
          </h4>
          <div className="flex items-start gap-1.5">
            <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="text-base font-medium text-secondary-foreground font-sans leading-tight">
              {cluster.area_label}
            </p>
          </div>
        </div>

        {/* Timeline activity metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 border-t border-slate-50">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              First Logged
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-sans">
              <Calendar size={13} className="text-slate-300" />
              <span>{formatDate(cluster.first_reported_at)}</span>
            </div>
          </div>
          
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Last Active
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-sans">
              <Calendar size={13} className="text-slate-300" />
              <span>{formatDate(cluster.last_reported_at)}</span>
            </div>
          </div>
        </div>

        {/* Center coordinates */}
        <div className="pt-2 text-[10px] text-slate-400 font-normal leading-none font-mono">
          Location center: {cluster.center_lat.toFixed(5)}, {cluster.center_lng.toFixed(5)}
        </div>
      </div>
    </div>
  );
};
export default ClusterCard;
