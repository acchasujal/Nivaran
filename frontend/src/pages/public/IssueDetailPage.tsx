import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../core/hooks/usePageTitle';
import { useIssueDetail, usePublicConfig } from '../../api/queries';
import { CaseDetailHeader } from '../../features/discovery/components/CaseDetailHeader';
import { ComprehensiveEvidenceGallery } from '../../features/discovery/components/ComprehensiveEvidenceGallery';
import { ComprehensiveTimeline } from '../../features/discovery/components/ComprehensiveTimeline';
import { LoadingIndicator } from '../../design-system/primitives/feedback/LoadingIndicator';
import { ErrorState } from '../../design-system/primitives/feedback/ErrorState';
import { Button } from '../../design-system/primitives/buttons/Button';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  usePageTitle(`Case #${id || ''} Detail & Timeline — Nivaran`);
  const { data, isLoading, isError, refetch } = useIssueDetail(id || '');
  const { data: publicConfig } = usePublicConfig();

  if (!id) {
    return (
      <ErrorState
        title="No Case Specified"
        description="Please select a valid case from the Discovery feed or Operations map."
        onRetry={() => navigate('/discover')}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingIndicator label={`Loading case record #${id}...`} size="lg" />
      </div>
    );
  }

  if (isError || !data?.issue) {
    return (
      <ErrorState
        title="Case Not Found"
        description={`Civic case #${id} could not be retrieved from the backend API.`}
        onRetry={() => refetch()}
      />
    );
  }

  const issue = data.issue;
  const cluster = data.cluster;
  const approvedDraft = data.action_drafts.find((draft) => draft.status === 'approved');
  const escalation = data.action_drafts.find((draft) => draft.escalation)?.escalation;
  const pipelineProcessing = issue.status === 'classified' || issue.status === 'clustered';

  return (
    <div className="space-y-6 font-sans py-2">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          leadingIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Discovery
        </Button>
      </div>

      <CaseDetailHeader issue={issue} areaLabel={cluster?.area_label} />

      {pipelineProcessing && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3" role="status">
          <p className="text-sm font-semibold text-sky-900">Evidence pipeline still processing</p>
          <p className="mt-1 text-sm text-sky-800">
            Nivaran is completing corroboration and will show the impact and action package when the available
            evidence supports it. This page refreshes automatically while processing continues.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComprehensiveEvidenceGallery issue={issue} />
        <ComprehensiveTimeline detail={data} />
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-subtle" aria-labelledby="action-package-heading">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3">
          <div>
            <h2 id="action-package-heading" className="flex items-center gap-2 text-lg font-bold text-neutral-900">
              <FileText className="h-5 w-5 text-primary-700" aria-hidden="true" />
              Evidence-to-Action Package
            </h2>
            <p className="mt-1 text-sm text-neutral-700">
              {data.impact_summary
                ? `${data.impact_summary.evidence_count} evidence report${data.impact_summary.evidence_count === 1 ? '' : 's'} informed this package.`
                : 'An action package appears after sufficient evidence is corroborated.'}
            </p>
          </div>
          <ShieldCheck className="h-5 w-5 text-emerald-700" aria-label="Human review required" />
        </div>

        {data.impact_summary && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-md bg-neutral-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Impact assessment</p>
              <p className="mt-1 text-sm text-neutral-800">{data.impact_summary.affected_area_description}</p>
            </div>
            <div className="rounded-md bg-neutral-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Available action documents</p>
              <p className="mt-1 text-sm text-neutral-800">
                {data.action_drafts.length > 0
                  ? data.action_drafts.map((draft) => draft.draft_type.replace('_', ' ')).join(' · ')
                  : 'Pending corroborated evidence'}
              </p>
            </div>
            <div className="rounded-md bg-neutral-50 p-3 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Evidence references</p>
              <p className="mt-1 text-sm font-mono text-neutral-800">
                Primary report: {issue.id}{cluster?.id ? ` · Cluster: ${cluster.id}` : ''}
              </p>
            </div>
            {publicConfig?.gemini_model && (
              <div className="rounded-md bg-neutral-50 p-3 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Processing metadata</p>
                <p className="mt-1 text-sm text-neutral-800">
                  Structured analysis model: <span className="font-mono">{publicConfig.gemini_model}</span>
                </p>
              </div>
            )}
            <div className="rounded-md bg-neutral-50 p-3 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Review and dispatch state</p>
              <p className="mt-1 text-sm text-neutral-800">
                {approvedDraft
                  ? 'Action package approved by a human reviewer.'
                  : 'Action package is awaiting human review.'}
                {' '}
                {escalation?.status === 'sent'
                  ? 'Email dispatch recorded.'
                  : escalation?.status === 'exported'
                    ? 'PDF export recorded.'
                    : 'No dispatch has been recorded.'}
              </p>
            </div>
          </div>
        )}
        {!data.impact_summary && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3" role="status">
            <p className="text-sm font-semibold text-amber-900">Action package pending corroborated evidence</p>
            <p className="mt-1 text-sm text-amber-800">
              Impact analysis and action documents are not available yet. The case remains reviewable while the
              evidence pipeline completes; no document is being presented as ready or dispatched.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default IssueDetailPage;
