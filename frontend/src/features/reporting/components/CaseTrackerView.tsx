import React from 'react';
import { useIssueDetail } from '../../../api/queries';
import { CaseTimelineLayout } from '../../../design-system/layouts/CaseTimelineLayout';
import { Timeline } from '../../../design-system/composites/timeline/Timeline';
import { StatusEvent } from '../../../design-system/composites/timeline/StatusEvent';
import { GovernmentEvent } from '../../../design-system/composites/timeline/GovernmentEvent';
import { VerificationEvent } from '../../../design-system/composites/timeline/VerificationEvent';
import { LoadingIndicator } from '../../../design-system/primitives/feedback/LoadingIndicator';
import { ErrorState } from '../../../design-system/primitives/feedback/ErrorState';
import { Button } from '../../../design-system/primitives/buttons/Button';

export interface CaseTrackerViewProps {
  issueId: string;
}

export const CaseTrackerView: React.FC<CaseTrackerViewProps> = ({ issueId }) => {
  const { data, isLoading, isError, refetch } = useIssueDetail(issueId);

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingIndicator label={`Fetching realtime status for Case #${issueId}...`} size="lg" />
      </div>
    );
  }

  if (isError || !data?.issue) {
    return (
      <ErrorState
        title="Unable to load case timeline"
        description={`Case #${issueId} could not be retrieved from the backend service.`}
        onRetry={() => refetch()}
      />
    );
  }

  const issue = data.issue;
  const cluster = data.cluster;

  return (
    <CaseTimelineLayout
      caseId={issue.id}
      title={issue.description || `${issue.issue_type.replace('_', ' ').toUpperCase()} Incident`}
      locality={cluster?.area_label || `Lat: ${issue.latitude.toFixed(3)}, Lng: ${issue.longitude.toFixed(3)}`}
      statusLabel={issue.status.toUpperCase()}
      statusCategory={issue.status === 'approved' ? 'verified' : 'government'}
      actionFooter={
        <>
          <span className="text-xs text-neutral-700 font-medium">Verified by local community?</span>
          <Button variant="primary" size="sm">Record Verification Vote</Button>
        </>
      }
      timelineContent={
        <Timeline>
          <StatusEvent
            statusLabel="Report Submitted & Cryptographically Verified"
            timestamp={new Date(issue.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            description={`Credibility score evaluated at ${(issue.credibility_score * 100).toFixed(0)}%.`}
          />

          {issue.status !== 'classified' && (
            <GovernmentEvent
              title="Official Institutional Acknowledgment"
              department="Municipal Public Works Authority"
              officerName="Public Service Desk"
              timestamp="Recent"
              officialDirective="Dispatched to department review queue for resolution."
            />
          )}

          {issue.status === 'approved' && (
            <VerificationEvent
              verifierName="Community Verifiers"
              timestamp="Completed"
              criteriaChecked={['Physical repair completed', 'Location audit passed']}
            />
          )}
        </Timeline>
      }
    />
  );
};
