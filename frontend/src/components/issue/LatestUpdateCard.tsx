import React from 'react';
import { motion } from 'framer-motion';
import { Info, ArrowRight, Send, FileDown, ThumbsUp, Share2, FileText } from 'lucide-react';
import type { Issue, ActionDraft, Cluster } from '@/api/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';

interface LatestUpdateCardProps {
  issue: Issue;
  actionDrafts: ActionDraft[];
  cluster?: Cluster | null;
  onApprove?: (draftId: string) => void;
  onEscalate?: (draftId: string, method: 'email' | 'pdf_export') => void;
}

interface UpdateInfo {
  headline: string;
  detail: string;
  timestamp: string;
  nextAction: string;
  isUrgent?: boolean;
}

const formatRelative = (iso: string): string => {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3_600_000);
    const diffD = Math.floor(diffH / 24);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

const deriveUpdate = (issue: Issue, actionDrafts: ActionDraft[]): UpdateInfo => {
  const pendingDraft = actionDrafts.find(d => d.status === 'pending_review');
  const approvedDraft = actionDrafts.find(d => d.status === 'approved');
  const activeEscalation = actionDrafts.find(d => d.escalation)?.escalation;

  if (issue.status === 'escalated' && activeEscalation?.status === 'sent') {
    return {
      headline: 'Complaint dispatched to authority',
      detail: `Email sent${activeEscalation.recipient ? ` to ${activeEscalation.recipient}` : ''}. Awaiting official acknowledgement within 30 days.`,
      timestamp: activeEscalation.sent_at || issue.created_at,
      nextAction: 'Awaiting acknowledgement. File RTI if no response in 30 days.',
    };
  }

  if (issue.status === 'escalated' && activeEscalation?.status === 'exported') {
    return {
      headline: 'PDF complaint package generated',
      detail: 'Complaint exported as PDF. Submit to the appropriate authority directly.',
      timestamp: activeEscalation.sent_at || issue.created_at,
      nextAction: 'Submit the PDF to your ward office or MCGM grievance portal.',
    };
  }

  if (approvedDraft) {
    return {
      headline: 'Brief approved — ready for dispatch',
      detail: 'Citizen has authorized the complaint. Send via email or download as PDF.',
      timestamp: approvedDraft.reviewed_at || approvedDraft.created_at,
      nextAction: 'Send the email or download the PDF complaint package.',
      isUrgent: true,
    };
  }

  if (pendingDraft) {
    return {
      headline: 'Complaint draft ready for review',
      detail: 'AI has prepared an official grievance brief. Authorize to escalate to the authority.',
      timestamp: pendingDraft.created_at,
      nextAction: 'Review and authorize the complaint brief.',
      isUrgent: true,
    };
  }

  if (issue.status === 'drafted') {
    return {
      headline: 'Complaint generated — awaiting approval',
      detail: 'The AI pipeline has completed all processing stages. Citizen review is required.',
      timestamp: issue.created_at,
      nextAction: 'Approve the complaint to enable dispatch.',
    };
  }

  if (issue.status === 'clustered') {
    return {
      headline: 'Clustered with nearby reports',
      detail: 'Agent 2 has matched this report with nearby submissions. Impact assessment in progress.',
      timestamp: issue.created_at,
      nextAction: 'Waiting for cluster threshold to trigger impact assessment.',
    };
  }

  return {
    headline: 'Report submitted — AI processing',
    detail: 'Evidence verified by Gemini Vision. Awaiting spatial clustering and impact assessment.',
    timestamp: issue.created_at,
    nextAction: 'No action required. AI pipeline is running.',
  };
};

export const LatestUpdateCard: React.FC<LatestUpdateCardProps> = ({
  issue,
  actionDrafts,
  cluster: _cluster,
  onApprove,
  onEscalate,
}) => {
  const update = deriveUpdate(issue, actionDrafts);
  const pendingDraft = actionDrafts.find(d => d.status === 'pending_review');
  const approvedDraft = actionDrafts.find(d => d.status === 'approved');
  const activeEscalation = actionDrafts.find(d => d.escalation)?.escalation;
  const isEmailSent = !!activeEscalation && (activeEscalation.status === 'sent' || activeEscalation.status === 'exported');
  const isApproved = !!approvedDraft || issue.status === 'approved' || issue.status === 'escalated';

  // Derive status badge value
  const badgeStatus = (() => {
    if (issue.status === 'escalated' && isEmailSent) return 'escalated';
    if (issue.status === 'escalated') return 'escalated';
    if (approvedDraft) return 'approved';
    if (pendingDraft) return 'pending_review';
    return issue.status;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'rounded-medium border shadow-subtle overflow-hidden',
        update.isUrgent
          ? 'border-amber-200 bg-amber-50/60'
          : 'border-slate-200 bg-white'
      )}
    >
      <div className={cn(
        'flex items-center justify-between px-5 py-3 border-b select-none',
        update.isUrgent ? 'border-amber-200/60 bg-amber-50' : 'border-slate-100 bg-slate-50/50'
      )}>
        <div className="flex items-center gap-2">
          <Info size={13} className={update.isUrgent ? 'text-amber-600' : 'text-primary'} />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Latest Update</span>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={badgeStatus} />
          <span className="text-[9px] text-slate-400">{formatRelative(update.timestamp)}</span>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        <div>
          <p className={cn(
            'text-sm font-bold leading-snug',
            update.isUrgent ? 'text-amber-800' : 'text-slate-800'
          )}>
            {update.headline}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{update.detail}</p>
        </div>

        {/* Next action hint */}
        <div className="flex items-start gap-1.5">
          <ArrowRight size={11} className="text-slate-350 shrink-0 mt-0.5" />
          <span className="text-[10px] text-slate-500 leading-relaxed">{update.nextAction}</span>
        </div>

        {/* Contextual CTAs */}
        <div className="flex flex-wrap gap-2 pt-1">
          {!isApproved && pendingDraft && onApprove && (
            <button
              type="button"
              onClick={() => onApprove(pendingDraft.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-small shadow-sm cursor-pointer active:scale-[0.98] transition-all"
            >
              <ThumbsUp size={11} /> Approve Complaint
            </button>
          )}

          {isApproved && !isEmailSent && approvedDraft && onEscalate && (
            <>
              <button
                type="button"
                onClick={() => onEscalate(approvedDraft.id, 'email')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary/90 text-white text-[10px] font-bold rounded-small shadow-sm cursor-pointer active:scale-[0.98] transition-all"
              >
                <Send size={11} /> Send Email
              </button>
              <button
                type="button"
                onClick={() => onEscalate(approvedDraft.id, 'pdf_export')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-250 bg-white text-[10px] font-bold rounded-small shadow-sm cursor-pointer hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                <FileDown size={11} /> Download PDF
              </button>
            </>
          )}

          {isEmailSent && activeEscalation?.pdf_download_url && (
            <a
              href={activeEscalation.pdf_download_url}
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-250 bg-white text-[10px] font-bold rounded-small shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              <FileDown size={11} /> Re-download PDF
            </a>
          )}

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-250 bg-white text-[10px] font-bold rounded-small shadow-sm cursor-pointer hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            <Share2 size={11} /> Share Tracker
          </button>

          {issue.status === 'escalated' && !isEmailSent && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-small">
              <FileText size={11} /> RTI Recommended
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LatestUpdateCard;
