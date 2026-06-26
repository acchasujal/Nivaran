import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, ThumbsUp, ThumbsDown, Send, FileDown, CheckCircle2, AlertTriangle, FileText, Landmark } from 'lucide-react';
import type { ActionDraft } from '@/api/types';
import { StatusBadge } from '../shared/StatusBadge';
import { cn } from '@/lib/utils';

interface DraftViewerProps {
  drafts: ActionDraft[];
  onApprove: (draftId: string) => void;
  onReject: (draftId: string) => void;
  onEscalate: (draftId: string, method: 'email' | 'pdf_export') => void;
  isSubmitting?: boolean;
}

export const DraftViewerComponent: React.FC<DraftViewerProps> = ({
  drafts,
  onApprove,
  onReject,
  onEscalate,
  isSubmitting = false,
}) => {
  const [activeTab, setActiveTab] = useState<string>('complaint');
  const [copied, setCopied] = useState<boolean>(false);

  const activeDraft = drafts.find((d) => d.draft_type === activeTab);

  const getTabLabel = (type: string) => {
    switch (type) {
      case 'complaint': return 'Official Complaint';
      case 'rti': return 'RTI Request';
      case 'community_summary': return 'Community Summary';
      default: return type;
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback
    }
  };

  const handleDownload = (type: string, text: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `civicpulse_${type}_draft.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (drafts.length === 0) {
    return (
      <div className="border border-slate-200 bg-white rounded-medium p-8 text-center select-none shadow-subtle">
        <FileText className="mx-auto h-10 w-10 text-slate-350 stroke-[1.5] mb-2" />
        <h4 className="text-sm font-semibold text-secondary-foreground font-sans">Complaint Drafts Pending</h4>
        <p className="text-xs text-slate-500 mt-1.5 font-sans leading-relaxed max-w-md mx-auto">
          Official complaint and RTI request drafts will be generated once sufficient neighborhood reports are compiled for this issue. Submit another report for this location, or trigger draft generation manually.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 bg-white rounded-medium flex flex-col overflow-hidden w-full shadow-subtle">
      {/* Dynamic Tab Switchers */}
      <div className="flex border-b border-slate-200 bg-slate-50/80 overflow-x-auto select-none">
        {drafts.map((draft) => (
          <button
            key={draft.id}
            type="button"
            onClick={() => setActiveTab(draft.draft_type)}
            className={cn(
              'px-5 py-3.5 text-xs font-bold font-sans border-r border-slate-200 transition-colors whitespace-nowrap cursor-pointer',
              activeTab === draft.draft_type
                ? 'bg-white text-primary border-t-2 border-t-primary'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            )}
          >
            {getTabLabel(draft.draft_type)}
          </button>
        ))}
      </div>

      {activeDraft ? (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="p-6 flex flex-col space-y-6 flex-1"
        >
          {/* Top Row: Info Status, Copy & Download Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 select-none">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Status Check:
              </span>
              <StatusBadge status={activeDraft.status} />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(activeDraft.content)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-xs font-semibold text-slate-600 rounded-small hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-sm"
                title="Copy content"
              >
                <Copy size={13} />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload(activeDraft.draft_type, activeDraft.content)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-xs font-semibold text-slate-600 rounded-small hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-sm"
                title="Download draft"
              >
                <Download size={13} />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Prominent Disclaimers for RTI / Complaint */}
          {(activeDraft.draft_type === 'rti' || activeDraft.draft_type === 'complaint') && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-small select-none text-xs text-amber-800 animate-fade leading-tight">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold uppercase tracking-wider text-[9px] text-amber-800">
                  Verification Notice & Legality Disclaimer
                </span>
                <p className="font-normal opacity-90 leading-snug">
                  This draft is prepared from community-submitted photographic evidence. Verify details and recipient offices before dispatch.
                </p>
              </div>
            </div>
          )}

          {/* Document Content View styled like a formal government brief */}
          <div className="official-document-paper rounded-small p-6 md:p-8 font-mono text-[11px] md:text-xs text-slate-850 leading-relaxed overflow-y-auto whitespace-pre-wrap select-text selection:bg-teal-150 selection:text-teal-900 border border-slate-350 min-h-[350px] relative max-h-[500px]">
            {/* Seal Watermark */}
            <div className="official-seal-watermark">
              CivicPulse Draft
            </div>

            {/* Letterhead Design */}
            <div className="official-document-header pb-4 mb-6 flex items-center justify-between gap-4 border-b border-slate-300 select-none">
              <div className="flex items-center gap-2">
                <Landmark size={18} className="text-slate-650" />
                <div className="leading-tight font-sans">
                  <span className="font-bold text-[10px] uppercase tracking-widest text-slate-850 block">
                    {activeDraft.draft_type === 'complaint' && 'Official Municipal Complaint'}
                    {activeDraft.draft_type === 'rti' && 'RTI Request Brief'}
                    {activeDraft.draft_type === 'community_summary' && 'Community Action Summary'}
                  </span>
                  <span className="text-[9px] text-slate-500 uppercase block font-semibold mt-0.5">
                    REF: CP-MUM-{activeDraft.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-right text-[9px] text-slate-500 font-sans leading-relaxed">
                <div>DATE: {new Date(activeDraft.created_at || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                <div className="font-bold text-slate-700">STATUS: {activeDraft.status.toUpperCase()}</div>
              </div>
            </div>

            {/* Official Header Addressee block */}
            <div className="mb-6 font-sans text-[11px] text-slate-650 leading-relaxed border-b border-slate-100 pb-4 select-text">
              {activeDraft.draft_type === 'complaint' && (
                <>
                  <p className="font-bold text-slate-800">TO:</p>
                  <p className="font-medium">The Ward Officer / Senior Executive Engineer</p>
                  <p>Municipal Corporation & Public Works Department</p>
                  <p>Mumbai Metropolitan Area Authority Office</p>
                </>
              )}
              {activeDraft.draft_type === 'rti' && (
                <>
                  <p className="font-bold text-slate-800">TO:</p>
                  <p className="font-medium">The Public Information Officer (PIO)</p>
                  <p>Municipal Secretariat / Right to Information Division</p>
                  <p>Mumbai Office of Administrative Records</p>
                </>
              )}
              {activeDraft.draft_type === 'community_summary' && (
                <>
                  <p className="font-bold text-slate-800">DOCUMENT PREPARATION:</p>
                  <p className="font-medium">CivicPulse Verification Council</p>
                  <p>Compiled Community Evidence Briefing</p>
                </>
              )}
            </div>

            {/* Content text */}
            <div className="relative z-10">
              {activeDraft.content}
            </div>
          </div>

          {/* Bottom Row Actions Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-100 select-none">
            {/* Approval Flow */}
            {activeDraft.status === 'pending_review' ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onApprove(activeDraft.id)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-small shadow transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <ThumbsUp size={13} />
                  <span>Authorize Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReject(activeDraft.id)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100/50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-small transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <ThumbsDown size={13} />
                  <span>Reject</span>
                </button>
              </div>
            ) : activeDraft.status === 'rejected' ? (
              <span className="text-xs font-bold text-rose-700 font-sans bg-rose-50 px-2.5 py-1 rounded-small border border-rose-200">
                This draft was rejected.
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 font-sans bg-emerald-50 px-2.5 py-1 rounded-small border border-emerald-250">
                <CheckCircle2 size={14} />
                <span>Authorized Brief</span>
              </span>
            )}

            {/* Escalation Actions */}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => activeDraft.status === 'approved' && !isSubmitting && onEscalate(activeDraft.id, 'email')}
                disabled={activeDraft.status !== 'approved' || isSubmitting}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-small shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none cursor-pointer',
                  activeDraft.status === 'approved'
                    ? 'bg-primary hover:bg-primary-hover text-white active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                )}
                title={activeDraft.status !== 'approved' ? 'Authorize document before sending.' : 'Send via Email'}
              >
                <Send size={13} />
                <span>Send Email</span>
              </button>
              <button
                type="button"
                onClick={() => activeDraft.status === 'approved' && !isSubmitting && onEscalate(activeDraft.id, 'pdf_export')}
                disabled={activeDraft.status !== 'approved' || isSubmitting}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-small shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none cursor-pointer',
                  activeDraft.status === 'approved'
                    ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                )}
                title={activeDraft.status !== 'approved' ? 'Authorize document before saving.' : 'Save to PDF'}
              >
                <FileDown size={13} />
                <span>Save as PDF</span>
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="p-8 text-center text-slate-400 font-sans text-xs select-none">
          Failed to load draft configuration.
        </div>
      )}
    </div>
  );
};

export const DraftViewer = React.memo(DraftViewerComponent);
export default DraftViewer;
