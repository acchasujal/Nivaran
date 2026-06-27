import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertTriangle, Play, Sparkles, Network, Scale, ShieldAlert, Landmark, FileCheck, Loader2 } from 'lucide-react';
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

  if (error || (!isLoading && !data)) {
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

  const { issue, cluster, impact_summary, action_drafts } = data || {
    issue: undefined,
    cluster: undefined,
    impact_summary: undefined,
    action_drafts: []
  };

  // Find if any draft has been successfully escalated
  const activeEscalation = action_drafts ? (action_drafts.find((d) => d.escalation)?.escalation || null) : null;

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

  return (
    <div className="flex-1 flex flex-col pb-12 font-sans">
      {/* Back button */}
      <div className="pt-6 select-none">
        <Link
          to="/tracker"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Operations Center</span>
        </Link>
      </div>

      {/* Page Header */}
      <PageHeader
        title="Case Operation File"
        subtitle={`Audit evidence trail, review impact assessments, and authorize briefs.`}
        action={
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-small text-xs font-bold text-slate-650 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer shadow-sm select-none"
          >
            <RefreshCw size={12} className={cn(isRefetching && 'animate-spin')} />
            <span>{isRefetching ? 'Refreshing...' : 'Sync Case File'}</span>
          </button>
        }
      />

      {/* Narrative Flow Stepper Layout */}
      <div className="max-w-4xl mx-auto w-full py-8 relative pl-8 md:pl-16">
        
        {/* Continuous Vertical Timeline Track Line */}
        <div className="absolute left-[15px] md:left-[31px] top-10 bottom-10 w-[2px] bg-slate-200/80 pointer-events-none" />

        {/* SECTION 1: Visual Evidence Intake */}
        <div className="relative pb-12">
          {/* Timeline Step circle badge */}
          <div className="absolute -left-[32px] md:-left-[48px] top-0 flex items-center justify-center h-8 w-8 rounded-full border border-slate-350 bg-white text-xs font-bold text-slate-600 shadow-sm select-none">
            01
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 select-none">
              <Landmark size={15} className="text-primary shrink-0" />
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                Incident Evidence Intake
              </h3>
            </div>
            
            {isLoading || !issue ? (
              <div className="h-80 md:h-[400px] border border-slate-200 bg-white rounded-medium overflow-hidden shadow-subtle flex flex-col items-center justify-center animate-pulse p-6">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                <span className="text-xs text-slate-400">Loading visual evidence...</span>
              </div>
            ) : (
              <EvidenceCard
                issue={issue}
                imageIntegrityStatus={data?.image_integrity_status}
                imageIntegritySimilarity={data?.image_integrity_similarity}
                verificationSimilarity={data?.verification_similarity}
                verificationThreshold={data?.verification_threshold}
                verificationDecision={data?.verification_decision}
              />
            )}
          </div>
        </div>

        {/* SECTION 2: Automated Verification Pipeline */}
        <div className="relative pb-12">
          <div className="absolute -left-[32px] md:-left-[48px] top-0 flex items-center justify-center h-8 w-8 rounded-full border border-slate-350 bg-white text-xs font-bold text-slate-600 shadow-sm select-none">
            02
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 select-none">
              <Sparkles size={15} className="text-primary shrink-0" />
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                Automated Verification Status
              </h3>
            </div>
            
            <div className="border border-slate-200 bg-white rounded-medium p-6 md:p-8 shadow-subtle">
              <div className="space-y-1 border-b border-slate-100 pb-4 mb-6 select-none">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Verification Pipeline Engine
                </h4>
                <p className="text-[10px] text-slate-400">
                  Tracking active agent checks and safety parameter thresholds.
                </p>
              </div>
              {isLoading ? (
                <LoadingState variant="timeline" count={5} />
              ) : (
                <AgentTimeline
                  issue={issue}
                  cluster={cluster}
                  impactSummary={impact_summary}
                  actionDrafts={action_drafts}
                  layout="responsive"
                />
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: Community Corroboration */}
        <div className="relative pb-12">
          <div className="absolute -left-[32px] md:-left-[48px] top-0 flex items-center justify-center h-8 w-8 rounded-full border border-slate-350 bg-white text-xs font-bold text-slate-600 shadow-sm select-none">
            03
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 select-none">
              <Network size={15} className="text-primary shrink-0" />
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                Spatial Clustering & Deduplication
              </h3>
            </div>
            
            {isLoading ? (
              <div className="h-32 border border-slate-200 bg-white rounded-medium p-6 animate-pulse flex flex-col justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            ) : cluster && issue ? (
              <ClusterCard cluster={{
                ...cluster,
                center_lat: issue.latitude,
                center_lng: issue.longitude,
                first_reported_at: issue.created_at,
                last_reported_at: issue.created_at,
              }} />
            ) : (
              <div className="border border-slate-200 bg-white rounded-medium p-6 text-center select-none shadow-subtle text-slate-500 text-xs">
                Searching nearby coordinates... Case file is currently registered as a solitary report.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: Impact Assessment */}
        <div className="relative pb-12">
          <div className="absolute -left-[32px] md:-left-[48px] top-0 flex items-center justify-center h-8 w-8 rounded-full border border-slate-350 bg-white text-xs font-bold text-slate-600 shadow-sm select-none">
            04
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 select-none">
              <ShieldAlert size={15} className="text-primary shrink-0" />
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                Neighborhood Impact Intelligence
              </h3>
            </div>
            
            {isLoading ? (
              <div className="h-36 border border-slate-200 bg-white rounded-medium p-6 animate-pulse flex flex-col justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-full" />
                  <div className="h-3 bg-slate-200 rounded w-5/6" />
                </div>
              </div>
            ) : impact_summary && issue ? (
              <ImpactCard impact={{
                ...impact_summary,
                id: issue.id,
                cluster_id: cluster?.id || '',
                potential_consequences: impact_summary.potential_consequences || 'No consequences documented.',
                generated_at: issue.created_at
              }} />
            ) : (
              <EmptyState
                title="Impact Assessment Pending"
                description="Neighborhood Impact analysis will activate automatically once more matching reports are submitted for this area. You can trigger the assessment manually for testing."
                icon={AlertTriangle}
                action={
                  cluster && (
                    <button
                      onClick={handleTriggerImpact}
                      disabled={triggerImpactMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-250 bg-white text-xs font-bold text-slate-700 rounded-small hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                    >
                      <Play size={12} className={cn(triggerImpactMutation.isPending && 'animate-spin')} />
                      <span>{triggerImpactMutation.isPending ? 'Generating...' : 'Trigger Neighborhood Impact'}</span>
                    </button>
                  )
                }
              />
            )}
          </div>
        </div>

        {/* SECTION 5: Official Action Drafts */}
        <div className="relative pb-12">
          <div className="absolute -left-[32px] md:-left-[48px] top-0 flex items-center justify-center h-8 w-8 rounded-full border border-slate-350 bg-white text-xs font-bold text-slate-600 shadow-sm select-none">
            05
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 select-none">
              <Scale size={15} className="text-primary shrink-0" />
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                Accountability Action Drafts
              </h3>
            </div>
            
            {isLoading ? (
              <LoadingState variant="document-viewer" />
            ) : action_drafts && action_drafts.length > 0 && issue ? (
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
            ) : (
              <EmptyState
                title="Action Briefs Pending"
                description="Official complaint briefs will be compiled automatically once matching reports are clustered and the impact assessment is processed."
                icon={AlertTriangle}
                action={
                  impact_summary && (
                    <button
                      onClick={handleTriggerDrafts}
                      disabled={triggerDraftsMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-250 bg-white text-xs font-bold text-slate-700 rounded-small hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
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

        {/* SECTION 6: Escalation & Logs */}
        <div className="relative">
          <div className="absolute -left-[32px] md:-left-[48px] top-0 flex items-center justify-center h-8 w-8 rounded-full border border-slate-350 bg-white text-xs font-bold text-slate-600 shadow-sm select-none">
            06
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 select-none">
              <FileCheck size={15} className="text-primary shrink-0" />
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                Escalation Dispatch & Action logs
              </h3>
            </div>
            
            {isLoading ? (
              <div className="h-24 border border-slate-200 bg-white rounded-medium p-6 animate-pulse flex items-center justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-8 bg-slate-200 rounded w-24" />
              </div>
            ) : activeEscalation ? (
              <div className="space-y-2 select-none">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                  Sendgrid HTTP API logs
                </h4>
                <EscalationCard escalation={activeEscalation} />
              </div>
            ) : (
              <div className="border border-slate-200 bg-white rounded-medium p-6 text-center select-none shadow-subtle text-slate-500 text-xs">
                Authorized documents are queued for SendGrid transmission. Approve briefs to dispatch.
              </div>
            )}
          </div>
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
          "fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 text-white rounded-medium shadow-premium text-xs font-bold animate-fade font-sans select-none border",
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
