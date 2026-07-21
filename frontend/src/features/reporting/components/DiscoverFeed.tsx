import React, { useState } from 'react';
import { useIssues } from '../../../api/queries';
import { MapWrapper } from '../../../design-system/patterns/maps/MapWrapper';
import { MapMarker } from '../../../design-system/patterns/maps/MapMarker';
import { EvidenceCard } from '../../../design-system/composites/evidence/EvidenceCard';
import { Tabs } from '../../../design-system/composites/navigation/Tabs';
import { LoadingIndicator } from '../../../design-system/primitives/feedback/LoadingIndicator';
import { ErrorState } from '../../../design-system/primitives/feedback/ErrorState';
import { EmptyState } from '../../../design-system/primitives/feedback/EmptyState';
import { useNavigate } from 'react-router-dom';

export const DiscoverFeed: React.FC = () => {
  const { data, isLoading, isError, refetch } = useIssues();
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <LoadingIndicator label="Loading nearby public reports..." size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load public reports"
        description="Could not connect to CivicPulse backend services. Local draft work remains safe."
        onRetry={() => refetch()}
      />
    );
  }

  const issues = data?.issues || [];

  const filteredIssues = issues.filter((iss) => {
    if (activeFilter === 'resolved') return iss.status === 'approved';
    if (activeFilter === 'active') return iss.status !== 'approved';
    return true;
  });

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900">Nearby Civic Reports & Hazards</h2>
        <span className="text-xs font-mono font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-sm">
          {filteredIssues.length} Reports
        </span>
      </div>

      <Tabs
        tabs={[
          { id: 'all', label: 'All Issues', count: issues.length },
          { id: 'active', label: 'In Progress', count: issues.filter((i) => i.status !== 'approved').length },
          { id: 'resolved', label: 'Verified Resolved', count: issues.filter((i) => i.status === 'approved').length },
        ]}
        value={activeFilter}
        onValueChange={(val) => setActiveFilter(val as any)}
      />

      <MapWrapper
        title="Map Context & Spatial Cluster View"
        listFallback={
          filteredIssues.length === 0 ? (
            <EmptyState title="No nearby issues found" description="Be the first citizen to report a civic issue in this area." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredIssues.map((issue) => (
                <EvidenceCard
                  key={issue.id}
                  id={issue.id}
                  title={issue.description || `${issue.issue_type.replace('_', ' ').toUpperCase()} Hazard`}
                  timestamp={new Date(issue.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  locality={`Lat: ${issue.latitude.toFixed(3)}, Lng: ${issue.longitude.toFixed(3)}`}
                  mediaUrl={issue.photo_url}
                  onInspect={() => navigate(`/issue/${issue.id}`)}
                />
              ))}
            </div>
          )
        }
      >
        <div className="w-full h-full p-6 flex flex-wrap items-center justify-center gap-3 bg-neutral-200">
          {filteredIssues.map((issue) => (
            <MapMarker
              key={issue.id}
              id={issue.id}
              label={issue.issue_type.replace('_', ' ')}
              status={issue.status === 'approved' ? 'resolved' : 'active'}
              latitude={issue.latitude}
              longitude={issue.longitude}
              onClick={() => navigate(`/issue/${issue.id}`)}
            />
          ))}
        </div>
      </MapWrapper>
    </div>
  );
};
