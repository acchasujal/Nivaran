import React, { useState } from 'react';
import { Copy, Download, ThumbsUp, ThumbsDown, Send, FileDown, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
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

export const DraftViewer: React.FC<DraftViewerProps> = ({
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
      case 'complaint': return 'Official Complaint Draft';
      case 'rti': return 'RTI Request Draft';
      case 'community_summary': return 'Community Brief';
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
      <div className="border border-secondary-border bg-white rounded-large p-8 text-center select-none">
        <FileText className="mx-auto h-10 w-10 text-slate-300 stroke-[1.5] mb-2" />
        <h4 className="text-sm font-semibold text-secondary-foreground font-sans">Complaint Drafts Pending</h4>
        <p className="text-xs text-slate-500 mt-1 font-sans">
          Drafts will be generated once sufficient evidence is collected.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-secondary-border bg-white rounded-large shadow-subtle flex flex-col overflow-hidden w-full">
      {/* Dynamic Tab Switchers */}
      <div className="flex border-b border-secondary-border bg-slate-50 overflow-x-auto select-none">
        {drafts.map((draft) => (
          <button
            key={draft.id}
            type="button"
            onClick={() => setActiveTab(draft.draft_type)}
            className={cn(
              'px-5 py-3.5 text-xs font-semibold font-sans border-r border-secondary-border transition-colors whitespace-nowrap cursor-pointer',
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
        <div className="p-6 flex flex-col space-y-6 flex-1">
          {/* Top Row: Info Status, Copy & Download Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-50 pb-4 select-none">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Status Check:
              </span>
              <StatusBadge status={activeDraft.status} />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(activeDraft.content)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-secondary-border bg-white text-xs font-semibold text-slate-600 rounded-small hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-sm"
                title="Copy content"
              >
                <Copy size={13} />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload(activeDraft.draft_type, activeDraft.content)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-secondary-border bg-white text-xs font-semibold text-slate-600 rounded-small hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-sm"
                title="Download draft"
              >
                <Download size={13} />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Prominent Disclaimers for RTI / Complaint */}
          {(activeDraft.draft_type === 'rti' || activeDraft.draft_type === 'complaint') && (
            <div className="flex items-start gap-2 p-3 bg-amber-50/50 border border-amber-100 rounded-small select-none text-xs text-amber-700 animate-fade leading-tight">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold uppercase tracking-wider text-[9px] text-amber-800">
                  Disclaimer Check
                </span>
                <p className="font-normal opacity-90 leading-snug">
                  AI-assisted document draft. Please verify all details (dates, names, addresses) for accuracy before submission or print output.
                </p>
              </div>
            </div>
          )}

          {/* Document Content View */}
          <div className="flex-1 min-h-[250px] bg-slate-50 border border-slate-100 rounded-small p-4 font-mono text-xs text-slate-700 leading-relaxed overflow-y-auto whitespace-pre-wrap select-text selection:bg-indigo-100 selection:text-indigo-900">
            {activeDraft.content}
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
                  <span>Approve Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReject(activeDraft.id)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100/50 text-rose-700 border border-rose-100 text-xs font-semibold rounded-small transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <ThumbsDown size={13} />
                  <span>Reject Draft</span>
                </button>
              </div>
            ) : activeDraft.status === 'rejected' ? (
              <span className="text-xs font-semibold text-rose-600 font-sans">
                This draft was rejected by a reviewer.
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 font-sans">
                <CheckCircle2 size={15} />
                <span>Authorized for Escalation</span>
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
                title={activeDraft.status !== 'approved' ? 'Approve this draft before escalating.' : 'Dispatch via SendGrid Email'}
              >
                <Send size={13} />
                <span>Dispatch Email</span>
              </button>
              <button
                type="button"
                onClick={() => activeDraft.status === 'approved' && !isSubmitting && onEscalate(activeDraft.id, 'pdf_export')}
                disabled={activeDraft.status !== 'approved' || isSubmitting}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-small shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none cursor-pointer',
                  activeDraft.status === 'approved'
                    ? 'border border-secondary-border bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                )}
                title={activeDraft.status !== 'approved' ? 'Approve this draft before escalating.' : 'Export to PDF package'}
              >
                <FileDown size={13} />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 font-sans text-xs select-none">
          Failed to load draft configuration.
        </div>
      )}
    </div>
  );
};
export default DraftViewer;
