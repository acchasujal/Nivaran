import React from 'react';
import { Layers, Calendar, MapPin, Hash, ShieldAlert } from 'lucide-react';
import type { Cluster } from '@/api/types';
import { formatDate } from '@/utils/issueHelpers';
import { cn } from '@/lib/utils';

interface ClusterCardProps {
  cluster: Cluster;
  className?: string;
}

export const ClusterCardComponent: React.FC<ClusterCardProps> = ({ cluster, className }) => {
  // Generate pseudo-coordinates for duplicate reports inside the 300m radius
  const duplicateMarkers = [
    { x: 70, y: 80, delay: '0s' },
    { x: 140, y: 130, delay: '0.4s' },
    { x: 190, y: 90, delay: '0.8s' },
    { x: 90, y: 160, delay: '1.2s' },
  ].slice(0, Math.min(cluster.report_count - 1, 4));

  return (
    <div className={cn('border border-slate-200 bg-white rounded-medium p-6 shadow-subtle', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 select-none">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-slate-50 text-slate-700 shrink-0 border border-slate-100">
            <Layers size={16} />
          </span>
          <span className="text-xs font-bold text-slate-700 font-sans uppercase tracking-wider">Spatial Cluster</span>
        </div>
        
        {/* Count badge */}
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
          <Hash size={11} />
          <span>{cluster.report_count} Matched Reports</span>
        </span>
      </div>

      {/* Grid Layout containing Details and the SVG Map */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Details (7/12 width) */}
        <div className="md:col-span-7 space-y-4">
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Verified Incident Locality
            </h4>
            <div className="flex items-start gap-1.5">
              <MapPin size={15} className="text-slate-450 shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-slate-800 font-sans leading-tight">
                {cluster.area_label}
              </p>
            </div>
          </div>

          {/* Timeline activity metadata */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                First Logged
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-650 font-sans font-medium">
                <Calendar size={13} className="text-slate-350" />
                <span>{formatDate(cluster.first_reported_at)}</span>
              </div>
            </div>
            
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Last Active
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-650 font-sans font-medium">
                <Calendar size={13} className="text-slate-350" />
                <span>{formatDate(cluster.last_reported_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-small select-none text-[10px] text-slate-500 leading-normal">
            <ShieldAlert size={14} className="text-slate-400 mt-0.5 shrink-0" />
            <p>
              AI verification clusters incoming reports within a 300m radius using Haversine formulas, raising credibility rankings for verified repeat reports.
            </p>
          </div>
        </div>

        {/* Right Column: Stylized SVG Spatial Map (5/12 width) */}
        <div className="md:col-span-5 border border-slate-200 bg-slate-50 rounded-medium overflow-hidden relative shadow-inner select-none h-44 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg">
            {/* Grid Lines */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(226, 232, 240, 0.6)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Spatial Verification Radius Circle (300m boundary) */}
            <circle cx="120" cy="90" r="60" fill="none" stroke="rgba(15, 118, 110, 0.15)" strokeWidth="1.5" strokeDasharray="3,3" />
            <circle cx="120" cy="90" r="60" fill="rgba(15, 118, 110, 0.02)" />

            {/* Label for Radius Boundary */}
            <text x="120" y="22" fontFamily="Inter" fontSize="7" fontWeight="bold" fill="#94a3b8" textAnchor="middle" letterSpacing="0.05em">
              300m Spatial Verification Zone
            </text>

            {/* Micro-Roadways/Grid representation */}
            <line x1="120" y1="0" x2="120" y2="180" stroke="rgba(203, 213, 225, 0.3)" strokeWidth="4" />
            <line x1="0" y1="90" x2="240" y2="90" stroke="rgba(203, 213, 225, 0.3)" strokeWidth="4" />

            {/* Nearby Clustered Duplicate Markers */}
            {duplicateMarkers.map((marker, i) => (
              <g key={i}>
                <circle cx={marker.x} cy={marker.y} r="4" fill="#94a3b8" opacity="0.8" />
                <circle cx={marker.x} cy={marker.y} r="7" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
              </g>
            ))}

            {/* Center Pinned Active Incident Marker */}
            <g>
              {/* Pulsing ring animation */}
              <circle cx="120" cy="90" r="10" fill="none" stroke="#0f766e" strokeWidth="1.5" opacity="0.3">
                <animate attributeName="r" values="6;14;6" dur="3s" repeatCount="indefinity" />
                <animate attributeName="opacity" values="0.6;0.1;0.6" dur="3s" repeatCount="indefinity" />
              </circle>
              {/* Active Marker Dot */}
              <circle cx="120" cy="90" r="5" fill="#0f766e" />
              <circle cx="120" cy="90" r="2.5" fill="#ffffff" />
            </g>

            {/* Map Pinned Label */}
            <rect x="75" y="98" width="90" height="12" rx="2" fill="rgba(15, 23, 42, 0.8)" />
            <text x="120" y="106" fontFamily="Inter" fontSize="7" fontWeight="bold" fill="#ffffff" textAnchor="middle">
              ACTIVE CASE TARGET
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};

export const ClusterCard = React.memo(ClusterCardComponent);
export default ClusterCard;
