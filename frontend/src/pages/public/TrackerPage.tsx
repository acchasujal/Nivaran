import React from 'react';
import { usePageTitle } from '../../core/hooks/usePageTitle';
import { useIssues } from '../../api/queries';
import { EvidenceCard } from '../../design-system/composites/evidence/EvidenceCard';
import { Tabs } from '../../design-system/composites/navigation/Tabs';
import { LoadingIndicator } from '../../design-system/primitives/feedback/LoadingIndicator';
import { ErrorState } from '../../design-system/primitives/feedback/ErrorState';
import { EmptyState } from '../../design-system/primitives/feedback/EmptyState';
import { useNavigate } from 'react-router-dom';

export const TrackerPage: React.FC = () => {
  usePageTitle('My Civic Reports — CivicPulse');
  const { data, isLoading, isError, refetch } = useIssues();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingIndicator label="Loading active case tracking records..." size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load tracked reports"
        description="Could not connect to CivicPulse backend services."
        onRetry={() => refetch()}
      />
    );
  }

  const issues = data?.issues || [];
  const activeIssues = issues.filter((i) => i.status !== 'approved');
  const resolvedIssues = issues.filter((i) => i.status === 'approved');

  return (
    <div className="space-y-4 font-sans py-2">
      <h2 className="text-xl font-bold text-neutral-900">Tracked Reports & Submissions</h2>

      <Tabs
        tabs={[
          {
            id: 'active',
            label: 'Active Cases',
            count: activeIssues.length,
            content:
              activeIssues.length === 0 ? (
                <EmptyState title="No active cases" description="You have no active reports currently awaiting municipal action." />
              ) : (
                <div className="space-y-3 pt-2">
                  {activeIssues.map((issue) => (
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
              ),
          },
          {
            id: 'resolved',
            label: 'Verified Resolved',
            count: resolvedIssues.length,
            content:
              resolvedIssues.length === 0 ? (
                <EmptyState title="No verified resolved cases" description="Resolved cases confirmed by verifiers appear here." />
              ) : (
                <div className="space-y-3 pt-2">
                  {resolvedIssues.map((issue) => (
                    <EvidenceCard
                      key={issue.id}
                      id={issue.id}
                      title={issue.description || `${issue.issue_type.replace('_', ' ').toUpperCase()} Hazard`}
                      timestamp={new Date(issue.created_at).toLocaleDateString()}
                      locality={`Lat: ${issue.latitude.toFixed(3)}, Lng: ${issue.longitude.toFixed(3)}`}
                      mediaUrl={issue.photo_url}
                      onInspect={() => navigate(`/issue/${issue.id}`)}
                    />
                  ))}
                </div>
              ),
          },
        ]}
      />
    </div>
  );
};

export default TrackerPage;
