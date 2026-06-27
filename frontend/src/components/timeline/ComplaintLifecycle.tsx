import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Circle, Send, FileDown, ThumbsUp, AlertTriangle } from 'lucide-react';
import type { Issue, ActionDraft, Cluster, ImpactSummary } from '@/api/types';
import { cn } from '@/lib/utils';

interface ComplaintLifecycleProps {
  issue: Issue;
  actionDrafts: ActionDraft[];
  cluster?: Cluster | null;
  impactSummary?: ImpactSummary | null;
  onApprove?: (draftId: string) => void;
  onEscalate?: (draftId: string, method: 'email' | 'pdf_export') => void;
}

type StepState = 'completed' | 'active' | 'expected';

interface LifecycleStep {
  id: string;
  label: string;
  description: string;
  state: StepState;
  timestamp?: string;
  actionNode?: React.ReactNode;
}

const formatTs = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export const ComplaintLifecycle: React.FC<ComplaintLifecycleProps> = ({
  issue,
  actionDrafts,
  cluster: _cluster,
  impactSummary,
  onApprove,
  onEscalate,
}) => {
  const status = issue.status;

  // Derive real state booleans from existing data
  const isAiVerified          = issue.credibility_score >= 0.8;
  const isImpactAssessed      = !!impactSummary;
  const pendingDraft          = actionDrafts.find(d => d.status === 'pending_review');
  const approvedDraft         = actionDrafts.find(d => d.status === 'approved');
  const hasAnyDraft           = actionDrafts.length > 0;
  const isComplaintGenerated  = hasAnyDraft || status === 'drafted' || status === 'escalated';
  const isApproved            = !!approvedDraft || status === 'approved' || status === 'escalated';
  const activeEscalation      = actionDrafts.find(d => d.escalation)?.escalation;
  const isEmailSent           = !!activeEscalation && (activeEscalation.status === 'sent' || activeEscalation.status === 'exported');
  const isEscalated           = status === 'escalated' || isEmailSent;

  // Build steps
  const steps: LifecycleStep[] = [
    {
      id: 'submitted',
      label: 'Report Submitted',
      description: 'Photographic evidence logged on the public spatial ledger.',
      state: 'completed',
      timestamp: issue.created_at,
    },
    {
      id: 'ai_verified',
      label: 'AI Verified',
      description: `Gemini Vision confirmed ${Math.round(issue.credibility_score * 100)}% credibility — classified as ${issue.issue_type.replace('_', ' ')}.`,
      state: isAiVerified ? 'completed' : 'active',
      timestamp: issue.created_at,
    },
    {
      id: 'impact_assessed',
      label: 'Impact Assessed',
      description: impactSummary
        ? `${impactSummary.risk_level.charAt(0).toUpperCase() + impactSummary.risk_level.slice(1)} risk — ${impactSummary.affected_area_description?.slice(0, 80)}…`
        : 'Neighborhood impact assessment pending cluster threshold.',
      state: isImpactAssessed ? 'completed' : (isAiVerified ? 'active' : 'expected'),
      timestamp: impactSummary?.generated_at,
    },
    {
      id: 'complaint_generated',
      label: 'Complaint Generated',
      description: hasAnyDraft
        ? `${actionDrafts.length} official brief${actionDrafts.length > 1 ? 's' : ''} prepared (RTI + Complaint).`
        : 'Official complaint and RTI drafts are pending impact assessment.',
      state: isComplaintGenerated ? 'completed' : (isImpactAssessed ? 'active' : 'expected'),
      timestamp: hasAnyDraft ? actionDrafts[0]?.created_at : undefined,
    },
    {
      id: 'approved',
      label: 'Approved',
      description: isApproved
        ? 'Brief authorized by citizen for official dispatch.'
        : 'Citizen review and authorization required before dispatch.',
      state: isApproved ? 'completed' : (isComplaintGenerated ? 'active' : 'expected'),
      timestamp: approvedDraft?.reviewed_at ?? undefined,
      actionNode: !isApproved && pendingDraft && onApprove ? (
        <button
          type="button"
          onClick={() => onApprove(pendingDraft.id)}
          className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-small shadow-sm transition-all cursor-pointer active:scale-[0.98]"
        >
          <ThumbsUp size={11} />
          <span>Authorize Brief</span>
        </button>
      ) : undefined,
    },
    {
      id: 'email_sent',
      label: 'Email / PDF Sent',
      description: activeEscalation
        ? activeEscalation.status === 'sent'
          ? `Email dispatched via SendGrid${activeEscalation.recipient ? ` to ${activeEscalation.recipient}` : ''}.`
          : activeEscalation.status === 'exported'
          ? 'Complaint package exported as PDF document.'
          : 'Dispatch failed — retry or export as PDF.'
        : 'Awaiting authorization before dispatch.',
      state: isEmailSent ? 'completed' : (isApproved ? 'active' : 'expected'),
      timestamp: activeEscalation?.sent_at ?? undefined,
      actionNode: isApproved && !isEmailSent && approvedDraft && onEscalate ? (
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => onEscalate(approvedDraft.id, 'email')}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-[10px] font-bold rounded-small shadow-sm cursor-pointer active:scale-[0.98]"
          >
            <Send size={11} /> Send Email
          </button>
          <button
            type="button"
            onClick={() => onEscalate(approvedDraft.id, 'pdf_export')}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-250 bg-white text-[10px] font-bold rounded-small shadow-sm cursor-pointer hover:bg-slate-50 active:scale-[0.98]"
          >
            <FileDown size={11} /> Download PDF
          </button>
        </div>
      ) : undefined,
    },
    {
      id: 'awaiting_response',
      label: 'Awaiting Government Response',
      description: 'Statutory 30-day response window under RTI Act 2005 Section 7(1).',
      state: isEscalated ? 'active' : 'expected',
    },
    {
      id: 'acknowledged',
      label: 'Acknowledged',
      description: 'Expected: Department acknowledges receipt of the complaint.',
      state: 'expected',
    },
    {
      id: 'assigned',
      label: 'Assigned',
      description: 'Expected: Delegated to ward engineer or department officer.',
      state: 'expected',
    },
    {
      id: 'inspection',
      label: 'Inspection',
      description: 'Expected: On-site verification survey by field officer.',
      state: 'expected',
    },
    {
      id: 'repair',
      label: 'Repair Phase',
      description: 'Expected: Municipal works teams begin restoration.',
      state: 'expected',
    },
    {
      id: 'citizen_verification',
      label: 'Citizen Verification',
      description: 'Expected: Resident confirms repair completion on-site.',
      state: 'expected',
    },
    {
      id: 'closed',
      label: 'Case Closed',
      description: 'Expected: Issue archived on public ledger.',
      state: 'expected',
    },
  ];

  return (
    <div className="border border-slate-200 bg-white rounded-medium shadow-subtle overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 select-none">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Complaint Lifecycle
        </h4>
        <p className="text-[10px] text-slate-450 mt-0.5">
          Real milestones from AI pipeline · Future stages clearly labelled as expected
        </p>
      </div>

      <div className="p-6 relative">
        {/* Vertical track line */}
        <div className="absolute left-[30px] top-6 bottom-6 w-[2px] bg-slate-100 pointer-events-none" />

        <div className="space-y-1">
          {steps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04, ease: 'easeOut' }}
              className="relative flex gap-4 pb-5 last:pb-0"
            >
              {/* Step dot */}
              <div className="relative z-10 flex-shrink-0 w-[24px] flex justify-center pt-0.5">
                {step.state === 'completed' ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 border border-emerald-500 text-emerald-600 shadow-sm">
                    <CheckCircle2 size={12} strokeWidth={2.5} />
                  </span>
                ) : step.state === 'active' ? (
                  <motion.span
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 border border-amber-400 text-amber-600 shadow-sm"
                  >
                    <Clock size={12} strokeWidth={2.5} />
                  </motion.span>
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm">
                    <Circle size={5} className="fill-slate-200 stroke-none" />
                  </span>
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className={cn(
                    'text-xs font-bold',
                    step.state === 'completed' && 'text-slate-800',
                    step.state === 'active' && 'text-amber-700',
                    step.state === 'expected' && 'text-slate-400',
                  )}>
                    {step.label}
                  </span>
                  {step.state === 'completed' && (
                    <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wide select-none">
                      Done
                    </span>
                  )}
                  {step.state === 'active' && (
                    <span className="text-[8px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wide select-none">
                      Current
                    </span>
                  )}
                  {step.state === 'expected' && (
                    <span className="text-[8px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wide select-none">
                      Expected
                    </span>
                  )}
                </div>

                <p className={cn(
                  'text-[10px] leading-relaxed',
                  step.state === 'expected' ? 'text-slate-400' : 'text-slate-500'
                )}>
                  {step.description}
                </p>

                {step.timestamp && (
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                    {formatTs(step.timestamp)}
                  </span>
                )}

                {step.actionNode}
              </div>
            </motion.div>
          ))}
        </div>

        {/* RTI recommendation if escalated but no response yet */}
        {isEscalated && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4 ml-10 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-small"
          >
            <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[10px] text-amber-800 leading-relaxed">
              <span className="font-bold">RTI Recommended:</span> If no acknowledgement is received within 30 days,
              file an RTI request under Section 6(1) of the RTI Act 2005 to track the complaint status.
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ComplaintLifecycle;
