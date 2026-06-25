import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertTriangle, Play } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

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

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
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
      const response = await escalateDraftMutation.mutateAsync({
        draftId: escalateDraftId,
        method: escalateMethod,
        recipient,
      });
      setEscalateDraftId(null);
      if (response.method === 'pdf_export' && escalateMethod === 'email') {
        showToast('Email dispatch failed. Generated fallback PDF download.', 'warning');
      } else {
        showToast(
          escalateMethod === 'pdf_export'
            ? 'PDF package generated successfully!'
            : 'Escalation email dispatched successfully!',
          'success'
        );
      }
      refetch();
    } catch (e) {
      throw e;
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

      {/* Main Content Layout - Centered Vertical Story Flow */}
      <div className="max-w-3xl mx-auto w-full py-8 space-y-10">
        
        {/* 1. Evidence Photo & Image Analysis */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 select-none">
            1. Evidence Photo & Analysis
          </h2>
          <EvidenceCard issue={issue} />
        </div>

        {/* 2. Verification Pipeline */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 select-none">
            2. Verification Pipeline
          </h2>
          
          <div className="border border-slate-100 bg-white rounded-large p-6 md:p-8">
            <div className="space-y-1 border-b border-slate-50 pb-3 mb-6 select-none">
              <h3 className="text-sm font-semibold text-secondary-foreground font-sans">
                Automated Verification Status
              </h3>
              <p className="text-[10px] text-slate-400">
                Tracking real-time verification and match pipeline progress.
              </p>
            </div>
            <AgentTimeline
              issue={issue}
              cluster={cluster}
              impactSummary={impact_summary}
              actionDrafts={action_drafts}
              layout="responsive"
            />
          </div>

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

        {/* 3. Neighborhood Impact Assessment */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 select-none">
            3. Neighborhood Impact
          </h2>
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
              title="Neighborhood Impact Assessment Pending"
              description="Neighborhood Impact analysis will activate automatically once more matching reports are submitted for this area. You can trigger the assessment manually for testing."
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
        </div>

        {/* 4. Official Complaint & Dispatch */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 select-none">
            4. Official Complaint Brief
          </h2>
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
                    Real-World Send Logs
                  </h4>
                  <EscalationCard escalation={activeEscalation} />
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="Complaint Brief Pending"
              description="Official complaint briefs will be compiled automatically once matching reports are clustered and the impact assessment is processed."
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
      </div>

      {/* Confirmation & Dispatch Modals */}
      {approvalDraftId && (
        <ApprovalModal
          isOpen={!!approvalDraftId}
          onClose={() => setApprovalDraftId(null)}
          draftId={approvalDraftId}
          issueId={issueId}
          reportCount={cluster?.report_count || 1}
          areaLabel={cluster?.area_label || 'Designated Area'}
          recipientEmail="ward.office@example.gov" // Default recipient email matching spec
          draftType={action_drafts.find(d => d.id === approvalDraftId)?.draft_type || 'complaint'}
          onSuccess={showToast}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 text-white rounded-medium shadow-premium text-xs font-semibold animate-fade font-sans select-none border",
          toast.type === 'success' && "bg-slate-900 border-slate-800",
          toast.type === 'warning' && "bg-amber-600 border-amber-500",
          toast.type === 'error' && "bg-rose-600 border-rose-500"
        )}>
          <span>{toast.message}</span>
        </div>
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
