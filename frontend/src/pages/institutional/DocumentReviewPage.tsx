import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../core/hooks/usePageTitle';
import { useIssueDetail } from '../../api/queries';
import { OfficerCaseWorkspace } from '../../features/government/components/OfficerCaseWorkspace';
import { OfficialActionComposer } from '../../features/government/components/OfficialActionComposer';
import { DraftReviewPanel } from '../../features/government/components/DraftReviewPanel';
import { RepairManager } from '../../features/government/components/RepairManager';
import { LoadingIndicator } from '../../design-system/primitives/feedback/LoadingIndicator';
import { ErrorState } from '../../design-system/primitives/feedback/ErrorState';
import { Button } from '../../design-system/primitives/buttons/Button';
import { ArrowLeft } from 'lucide-react';

export const DocumentReviewPage: React.FC = () => {
  usePageTitle('Officer Action & Document Review Workspace — CivicPulse');
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useIssueDetail('CP-2026-001');

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingIndicator label="Loading officer action workspace..." size="lg" />
      </div>
    );
  }

  if (isError || !data?.issue) {
    return (
      <ErrorState
        title="Failed to load case workspace"
        description="Could not connect to CivicPulse backend services."
        onRetry={() => refetch()}
      />
    );
  }

  const issue = data.issue;
  const draft = data.action_drafts[0] || {
    id: 'DRAFT-99',
    cluster_id: 'CL-1',
    draft_type: 'complaint',
    content: 'Pursuant to the Municipal Public Works Accountability Act, formal notice is hereby issued to the Road Maintenance Directorate regarding verified pothole hazards on Main Arterial Sector 62.',
    status: 'pending_review',
    created_at: new Date().toISOString(),
    reviewed_at: null,
  };

  return (
    <div className="space-y-6 font-sans py-2">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/government/queue')}
          leadingIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Executive Work Queue
        </Button>
      </div>

      <OfficerCaseWorkspace issue={issue} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OfficialActionComposer
          caseId={issue.id}
          onActionSubmit={(action, details) => console.log('Action submitted:', action, details)}
        />
        <DraftReviewPanel issueId={issue.id} draft={draft} />
      </div>

      <RepairManager
        caseId={issue.id}
        onRepairCompleted={(photo, notes) => console.log('Repair completed:', photo, notes)}
      />
    </div>
  );
};

export default DocumentReviewPage;
