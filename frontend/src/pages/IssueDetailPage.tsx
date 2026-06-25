import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertTriangle, Play } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { EvidenceCard } from '@/components/issue/EvidenceCard';
import { ClusterCard } from '@/components/issue/ClusterCard';
import { ImpactCard } from '@/components/issue/ImpactCard';
import { DraftViewer } from '@/components/drafts/DraftViewer';
import { EscalationCard } from '@/components/escalation/EscalationCard';
import { AgentTimeline } from '@/components/timeline/AgentTimeline';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ApprovalModal } from '@/components/dialogs/ApprovalModal';
import { EscalationDialog } from '@/components/dialogs/EscalationDialog';
import { cn } from '@/lib/utils';
import {
  useIssueDetail,
  useApproveDraft,
  useEscalateDraft,
  useTriggerImpact,
  useTriggerDrafts,
} from '@/api/queries';

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const issueId = id || '';

  // API queries
  const { data, isLoading, error, refetch, isRefetching } = useIssueDetail(issueId);
  const approveDraftMutation = useApproveDraft(issueId);
  const escalateDraftMutation = useEscalateDraft(issueId);
  const triggerImpactMutation = useTriggerImpact(issueId, data?.cluster?.id || '');
  const triggerDraftsMutation = useTriggerDrafts(issueId, data?.cluster?.id || '');

  // Local UI States for dialogs/modals
  const [approvalDraftId, setApprovalDraftId] = useState<string | null>(null);
  const [escalateDraftId, setEscalateDraftId] = useState<string | null>(null);
  const [escalateMethod, setEscalateMethod] = useState<'email' | 'pdf_export'>('email');

  if (isLoading) {
    return <LoadingState variant="page" message="Retrieving report details..." />;
  }

  if (error || !data) {
    return (
      <div className="py-8">
        <ErrorState
          title="Failed to Load Issue Details"
          explanation={error instanceof Error ? error.message : 'The requested report could not be fetched.'}
          onRetry={refetch}
          retryText="Retry Fetching"
        />
      </div>
    );
  }

  const { issue, cluster, impact_summary, action_drafts } = data;

  // Find if any draft has been successfully escalated
  const activeEscalation = action_drafts.find((d) => d.escalation)?.escalation || null;

  // Handlers
  const handleApproveClick = (draftId: string) => {
    setApprovalDraftId(draftId);
  };

  const handleApproveConfirm = async () => {
    if (!approvalDraftId) return;
    try {
      await approveDraftMutation.mutateAsync({
        draftId: approvalDraftId,
        status: 'approved',
      });
      setApprovalDraftId(null);
    } catch (e) {
      // Handled via mutation state or global alert
    }
  };

  const handleRejectClick = async (draftId: string) => {
    if (window.confirm('Are you sure you want to reject this draft brief?')) {
      try {
        await approveDraftMutation.mutateAsync({
          draftId,
          status: 'rejected',
        });
      } catch (e) {
        // Handled via mutation
      }
    }
  };

  const handleEscalateClick = (draftId: string, method: 'email' | 'pdf_export') => {
    setEscalateDraftId(draftId);
    setEscalateMethod(method);
  };

  const handleEscalateConfirm = async (recipient?: string) => {
    if (!escalateDraftId) return;
    try {
      await escalateDraftMutation.mutateAsync({
        draftId: escalateDraftId,
        method: escalateMethod,
        recipient,
      });
      setEscalateDraftId(null);
    } catch (e) {
      // Handled via mutation
    }
  };

  const handleTriggerImpact = async () => {
    try {
      await triggerImpactMutation.mutateAsync();
    } catch (e) {
      // Handled
    }
  };

  const handleTriggerDrafts = async () => {
    try {
      await triggerDraftsMutation.mutateAsync();
    } catch (e) {
      // Handled
    }
  };

  // Handlers

  return (
    <div className="flex-1 flex flex-col pb-12">
      {/* Back button */}
      <div className="pt-6 select-none">
        <Link
          to="/tracker"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Public Tracker</span>
        </Link>
      </div>

      {/* Page Header */}
      <PageHeader
        title={`Report Details`}
        subtitle={`Audit evidence, review AI accountability drafts, and dispatch escalations.`}
        action={
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-secondary-border rounded-small text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw size={12} className={cn(isRefetching && 'animate-spin')} />
            <span>{isRefetching ? 'Refreshing...' : 'Refresh Status'}</span>
          </button>
        }
      />

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 items-start">
        {/* Left Column: Context & Actions */}
        <div className="lg:col-span-8 space-y-8">
          {/* Section 1: Community Evidence & Verification */}
          <Section title="Community Evidence & Verification" description="Self-reported incident details verified and mapped against neighboring reports." className="py-0 border-b-0">
            <div className="space-y-6">
              <EvidenceCard issue={issue} />
              {cluster && (
                <ClusterCard cluster={{
                  ...cluster,
                  center_lat: issue.latitude,
                  center_lng: issue.longitude,
                  first_reported_at: issue.created_at,
                  last_reported_at: issue.created_at,
                }} />
              )}
            </div>
          </Section>

          {/* Section 2: Neighborhood Impact & Complaint Drafts */}
          <Section title="Neighborhood Impact & Complaint Drafts" description="AI-generated impact assessments and formal complaint drafts created from matching reports." className="py-0 border-b-0">
            <div className="space-y-6">
              {impact_summary ? (
                <ImpactCard impact={{
                  ...impact_summary,
                  id: issue.id,
                  cluster_id: cluster?.id || '',
                  potential_consequences: impact_summary.potential_consequences || 'No consequences documented.',
                  generated_at: issue.created_at
                }} />
              ) : (
                <EmptyState
                  title="Neighborhood Impact Awaiting Data"
                  description="Neighborhood Impact analysis will activate automatically after enough nearby reports are received. In the meantime, you can manually trigger the analysis for demo purposes below."
                  icon={AlertTriangle}
                  action={
                    cluster && (
                      <button
                        onClick={handleTriggerImpact}
                        disabled={triggerImpactMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white text-xs font-bold text-slate-700 rounded-small hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                      >
                        <Play size={12} className={cn(triggerImpactMutation.isPending && 'animate-spin')} />
                        <span>{triggerImpactMutation.isPending ? 'Generating...' : 'Trigger Neighborhood Impact'}</span>
                      </button>
                    )
                  }
                />
              )}

              {action_drafts && action_drafts.length > 0 ? (
                <div className="space-y-6">
                  <DraftViewer
                    drafts={action_drafts.map(d => ({
                      ...d,
                      cluster_id: cluster?.id || '',
                      created_at: issue.created_at
                    }))}
                    onApprove={handleApproveClick}
                    onReject={handleRejectClick}
                    onEscalate={handleEscalateClick}
                    isSubmitting={approveDraftMutation.isPending || escalateDraftMutation.isPending}
                  />

                  {/* Escalation Receipt (renders below drafts if sent) */}
                  {activeEscalation && (
                    <div className="space-y-2 select-none">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                        Real-World Escalation Logs
                      </h4>
                      <EscalationCard escalation={activeEscalation} />
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  title="Complaint Drafts Pending"
                  description="Drafts will be generated once sufficient evidence is collected and the Neighborhood Impact assessment is complete."
                  icon={AlertTriangle}
                  action={
                    impact_summary && (
                      <button
                        onClick={handleTriggerDrafts}
                        disabled={triggerDraftsMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white text-xs font-bold text-slate-700 rounded-small hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                      >
                        <Play size={12} className={cn(triggerDraftsMutation.isPending && 'animate-spin')} />
                        <span>{triggerDraftsMutation.isPending ? 'Generating...' : 'Trigger Complaint Drafts'}</span>
                      </button>
                    )
                  }
                />
              )}
            </div>
          </Section>
        </div>

        {/* Right Column: Verification & Dispatch Pipeline */}
        <div className="lg:col-span-4 border border-secondary-border bg-white rounded-large p-6 space-y-6 shadow-subtle select-none">
          <div className="space-y-1 border-b border-secondary-border pb-3">
            <h3 className="text-sm font-semibold text-secondary-foreground font-sans">
              Verification & Dispatch Pipeline
            </h3>
            <p className="text-[10px] text-slate-400">
              Observe the progress of the automated verification pipeline.
            </p>
          </div>

          <AgentTimeline
            issueStatus={issue.status}
            hasImpactSummary={!!impact_summary}
            hasDrafts={action_drafts.length > 0}
            isDraftApproved={action_drafts.some(d => d.status === 'approved')}
            escalationStatus={activeEscalation?.status}
          />
        </div>
      </div>

      {/* Confirmation & Dispatch Modals */}
      {approvalDraftId && (
        <ApprovalModal
          isOpen={!!approvalDraftId}
          onClose={() => setApprovalDraftId(null)}
          onConfirm={handleApproveConfirm}
          reportCount={cluster?.report_count || 1}
          areaLabel={cluster?.area_label || 'Designated Area'}
          recipientEmail="ward.office@example.gov" // Default recipient email matching spec
          isSubmitting={approveDraftMutation.isPending}
        />
      )}

      {escalateDraftId && (
        <EscalationDialog
          isOpen={!!escalateDraftId}
          onClose={() => setEscalateDraftId(null)}
          onSend={handleEscalateConfirm}
          method={escalateMethod}
          isSubmitting={escalateDraftMutation.isPending}
        />
      )}
    </div>
  );
};
export default IssueDetailPage;
