import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageTitle } from '../../core/hooks/usePageTitle';
import { useIssueDetail } from '../../api/queries';
import { OfficerCaseWorkspace } from '../../features/government/components/OfficerCaseWorkspace';
import { DraftReviewPanel } from '../../features/government/components/DraftReviewPanel';
import { LoadingIndicator } from '../../design-system/primitives/feedback/LoadingIndicator';
import { ErrorState } from '../../design-system/primitives/feedback/ErrorState';
import { Button } from '../../design-system/primitives/buttons/Button';
import { ArrowLeft } from 'lucide-react';

export const DocumentReviewPage: React.FC = () => {
  usePageTitle('Officer Action & Document Review Workspace - Nivaran');
  const navigate = useNavigate();
  const { issueId } = useParams<{ issueId: string }>();
  const { data, isLoading, isError, refetch } = useIssueDetail(issueId || '');

  if (!issueId) {
    return <ErrorState title="No case selected" description="Choose a case from the government work queue." onRetry={() => navigate('/government/queue')} />;
  }

  if (isLoading) {
    return <div className="py-12 flex justify-center"><LoadingIndicator label="Loading officer action workspace..." size="lg" /></div>;
  }

  if (isError || !data?.issue) {
    return <ErrorState title="Failed to load case workspace" description="Could not connect to Nivaran backend services." onRetry={() => refetch()} />;
  }

  const issue = data.issue;
  const draft = data.action_drafts[0];

  return (
    <div className="space-y-6 font-sans py-2">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/government/queue')} leadingIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Executive Work Queue
        </Button>
      </div>

      <OfficerCaseWorkspace issue={issue} />

      {draft ? (
        <DraftReviewPanel issueId={issue.id} draft={draft} />
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-700">
          No action draft is available for this case. Draft review is unavailable until the analysis pipeline creates one.
        </div>
      )}
    </div>
  );
};

export default DocumentReviewPage;
