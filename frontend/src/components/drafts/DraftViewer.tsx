import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, ThumbsUp, ThumbsDown, Send, FileDown, CheckCircle2, AlertTriangle, FileText, Landmark, Edit, Save, X, RotateCcw, Sparkles } from 'lucide-react';
import type { ActionDraft, Issue } from '@/api/types';
import { StatusBadge } from '../shared/StatusBadge';
import { cn } from '@/lib/utils';
import { useUpdateDraft, useImproveDraft } from '@/api/queries';
import { getLocalityName } from '@/utils/getLocalityName';

interface DraftViewerProps {
  drafts: ActionDraft[];
  onApprove: (draftId: string) => void;
  onReject: (draftId: string) => void;
  onEscalate: (draftId: string, method: 'email' | 'pdf_export') => void;
  isSubmitting?: boolean;
  issue?: Issue;
  issueId?: string;
}

export const DraftViewerComponent: React.FC<DraftViewerProps> = ({
  drafts,
  onApprove,
  onReject,
  onEscalate,
  isSubmitting = false,
  issue,
  issueId = '',
}) => {
  const [activeTab, setActiveTab] = useState<string>('complaint');
  const [copied, setCopied] = useState<boolean>(false);

  // Editor states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedContent, setEditedContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('ward_officer');
  const [aiPrompt, setAiPrompt] = useState<string>('');

  const activeDraft = drafts.find((d) => d.draft_type === activeTab);

  // React Query mutations
  const updateDraftMutation = useUpdateDraft(issueId);
  const improveDraftMutation = useImproveDraft();

  // Reset editor state when switching tabs
  useEffect(() => {
    if (activeDraft) {
      setEditedContent(activeDraft.content);
      setOriginalContent(activeDraft.content);
      setIsEditing(false);
      setAiPrompt('');
      
      // Select appropriate recipient key based on draft type
      if (activeDraft.draft_type === 'rti') {
        setRecipient('pio');
      } else if (activeDraft.draft_type === 'complaint') {
        setRecipient('ward_officer');
      } else {
        setRecipient('community');
      }
    }
  }, [activeDraft?.id]);

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

  // Recipient selector template handler
  const handleRecipientChange = (recipientKey: string) => {
    setRecipient(recipientKey);
    let recipientHeader = '';
    
    if (recipientKey === 'ward_officer') {
      recipientHeader = "TO:\nThe Ward Officer / Senior Executive Engineer\nMunicipal Corporation & Public Works Department\nMumbai, Maharashtra";
    } else if (recipientKey === 'commissioner') {
      recipientHeader = "TO:\nThe Municipal Commissioner\nMunicipal Corporation of Greater Mumbai\nMumbai, Maharashtra";
    } else if (recipientKey === 'pio') {
      recipientHeader = "TO:\nThe Public Information Officer (PIO)\nRight to Information Cell, Municipal Secretariat\nMumbai Administrative Records Division";
    } else if (recipientKey === 'solid_waste') {
      recipientHeader = "TO:\nWard Executive Director (Solid Waste Management)\nMunicipal Environmental Works Branch\nMumbai, Maharashtra";
    } else if (recipientKey === 'water_dept') {
      recipientHeader = "TO:\nAssistant Ward Commissioner (Water Supply Department)\nMunicipal Hydraulic Engineering Division\nMumbai, Maharashtra";
    } else {
      recipientHeader = "DOCUMENT PREPARATION:\nCivicPulse Verification Council\nCompiled Community Evidence Briefing";
    }

    setEditedContent((prev) => {
      const lines = prev.split('\n');
      // If there is an existing TO: block or DOCUMENT PREPARATION:, replace it
      if (prev.startsWith("TO:") || prev.startsWith("DOCUMENT PREPARATION:")) {
        // Find the index of the first empty line separating header from body
        const emptyLineIdx = lines.findIndex(l => l.trim() === '');
        if (emptyLineIdx !== -1) {
          return recipientHeader + "\n" + lines.slice(emptyLineIdx).join("\n");
        }
      }
      return recipientHeader + "\n\n" + prev;
    });
  };

  // Auto-fill Citizen details and attachments summary
  const handleAutofillCitizenDetails = () => {
    const locality = issue ? getLocalityName(issue.latitude, issue.longitude) : 'Mumbai Ward';
    const gpsLock = issue ? `${issue.latitude.toFixed(5)}, ${issue.longitude.toFixed(5)}` : 'N/A';
    
    const citizenBlock = `\n\n---\nCitizen Verification Details:\nSubmitted By: Verified Resident (CivicPulse Authenticated)\nLocality Address: ${locality}, Mumbai, MH\nGPS Coordinates: ${gpsLock}\n\nSupporting Evidence Attachments:\n- Visual Verification Photo (Timestamped)\n- Perceptual visual integrity hashing clearance\n- CivicPulse Spatial Deduplication Registry record`;

    setEditedContent((prev) => {
      if (prev.includes("Citizen Verification Details:")) {
        // Strip out existing details block and re-add updated
        const idx = prev.indexOf("\n\n---\nCitizen Verification Details:");
        if (idx !== -1) {
          return prev.slice(0, idx) + citizenBlock;
        }
      }
      return prev + citizenBlock;
    });
  };

  // Call AI Improve Writing endpoint
  const handleAIImprove = async () => {
    if (!activeDraft) return;
    try {
      const response = await improveDraftMutation.mutateAsync({
        draftId: activeDraft.id,
        content: editedContent,
        prompt: aiPrompt.trim() || undefined,
      });
      setEditedContent(response.refined_text);
      setAiPrompt('');
    } catch (err) {
      console.error('AI improvement failed:', err);
    }
  };

  // Save modified draft
  const handleSaveDraft = async () => {
    if (!activeDraft) return;
    try {
      await updateDraftMutation.mutateAsync({
        draftId: activeDraft.id,
        content: editedContent,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
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
          {/* Top Row: Info Status, Copy & Edit Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 select-none">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Status Check:
              </span>
              <StatusBadge status={activeDraft.status} />
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setEditedContent(activeDraft.content);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-xs font-bold text-slate-700 rounded-small hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-sm"
                  title="Edit Brief"
                >
                  <Edit size={13} />
                  <span>Edit Draft</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => handleCopy(isEditing ? editedContent : activeDraft.content)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-xs font-semibold text-slate-600 rounded-small hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-sm"
                title="Copy content"
              >
                <Copy size={13} />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload(activeDraft.draft_type, isEditing ? editedContent : activeDraft.content)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-xs font-semibold text-slate-600 rounded-small hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-sm"
                title="Download draft"
              >
                <Download size={13} />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Warnings & Notices */}
          {(activeDraft.draft_type === 'rti' || activeDraft.draft_type === 'complaint') && !isEditing && (
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

          {/* Interactive Workspace Body: Split Editor & Live Preview on Desktop */}
          <div className={cn("grid grid-cols-1 gap-6", isEditing && "lg:grid-cols-12")}>
            
            {/* 1. Left Hand Editor Column (Only shown in Edit mode) */}
            {isEditing && (
              <div className="lg:col-span-6 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-200 pb-6 lg:pb-0 lg:pr-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Complaint Editing Workspace
                  </h4>

                  {/* Recipient Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Recipient / Municipal Department
                    </label>
                    <select
                      value={recipient}
                      onChange={(e) => handleRecipientChange(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-small px-3 py-2 text-xs font-medium focus:outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                      <option value="ward_officer">Ward Officer / Senior Executive Engineer (PWD)</option>
                      <option value="commissioner">Municipal Commissioner (MCGM)</option>
                      <option value="pio">Public Information Officer (RTI Cell)</option>
                      <option value="solid_waste">Senior Ward Executive (Solid Waste Management)</option>
                      <option value="water_dept">Assistant Ward Commissioner (Water Supply)</option>
                      <option value="community">CivicPulse Verification Council (Community Brief)</option>
                    </select>
                  </div>

                  {/* Citizen details filler action */}
                  <button
                    type="button"
                    onClick={handleAutofillCitizenDetails}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary/20 bg-teal-50/50 hover:bg-teal-50 text-[10px] font-bold text-primary rounded-small transition-colors cursor-pointer select-none"
                  >
                    📝 Auto-fill Citizen Verification & Attachments
                  </button>

                  {/* Text Editor Area */}
                  <div className="space-y-1 pt-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Document Content Body
                    </label>
                    <textarea
                      rows={14}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full text-xs font-mono border border-slate-300 rounded-small p-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none bg-slate-50/50 font-medium"
                      placeholder="Write complaint contents..."
                    />
                  </div>

                  {/* AI Improve Prompt Block */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-small p-4.5 space-y-3 mt-4">
                    <div className="flex items-center gap-2 select-none">
                      <Sparkles size={14} className="text-primary" />
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        AI Refinement Assistant (Gemini-Powered)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Guidance e.g. 'make it concise', 'use highly urgent tone'"
                        className="flex-1 text-xs border border-slate-250 rounded-small px-3 py-1.5 focus:outline-none focus:border-primary bg-white"
                        disabled={improveDraftMutation.isPending}
                      />
                      <button
                        type="button"
                        onClick={handleAIImprove}
                        disabled={improveDraftMutation.isPending || !editedContent.trim()}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-small shadow transition-colors cursor-pointer disabled:opacity-50 min-h-[32px]"
                      >
                        {improveDraftMutation.isPending ? 'Improving...' : 'AI Refine'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Workspace Save / Controls Row */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={updateDraftMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-small shadow transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <Save size={13} />
                    <span>{updateDraftMutation.isPending ? 'Saving...' : 'Save Draft'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedContent(activeDraft.content);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-250 bg-white text-slate-650 hover:bg-slate-50 text-xs font-bold rounded-small shadow-sm transition-all cursor-pointer active:scale-98"
                  >
                    <X size={13} />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Reset back to original AI draft? Unsaved changes will be lost.")) {
                        setEditedContent(originalContent);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-amber-250 bg-amber-50/20 text-amber-705 hover:bg-amber-50/50 text-xs font-semibold rounded-small transition-all cursor-pointer ml-auto"
                    title="Reset to original AI text"
                  >
                    <RotateCcw size={12} />
                    <span>Reset to AI</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Right Hand / Live Preview Column */}
            <div className={cn("w-full flex flex-col", isEditing ? "lg:col-span-6" : "w-full")}>
              {isEditing && (
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 select-none">
                  Live Document Preview:
                </div>
              )}
              {/* Document Paper Container */}
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
                      <span className="font-bold text-[10px] uppercase tracking-widest text-slate-850 block font-sans">
                        {activeDraft.draft_type === 'complaint' && 'Official Municipal Complaint'}
                        {activeDraft.draft_type === 'rti' && 'RTI Request Brief'}
                        {activeDraft.draft_type === 'community_summary' && 'Community Action Summary'}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold mt-0.5 font-sans">
                        REF: CP-MUM-{activeDraft.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-[9px] text-slate-500 font-sans leading-relaxed font-sans select-none">
                    <div>DATE: {new Date(activeDraft.created_at || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                    <div className="font-bold text-slate-700">STATUS: {activeDraft.status.toUpperCase()}</div>
                  </div>
                </div>

                {/* Content body text rendering in real time */}
                <div className="relative z-10 font-mono">
                  {isEditing ? editedContent : activeDraft.content}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row Actions Panel (Only shown in standard view mode) */}
          {!isEditing && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-100 select-none w-full">
              {/* Approval Flow */}
              {activeDraft.status === 'pending_review' ? (
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => onApprove(activeDraft.id)}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-small shadow transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer min-h-[40px]"
                  >
                    <ThumbsUp size={13} />
                    <span>Authorize</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(activeDraft.id)}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100/50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-small transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer min-h-[40px]"
                  >
                    <ThumbsDown size={13} />
                    <span>Reject</span>
                  </button>
                </div>
              ) : activeDraft.status === 'rejected' ? (
                <span className="text-xs font-bold text-rose-700 font-sans bg-rose-50 px-2.5 py-1.5 rounded-small border border-rose-200 self-start">
                  This draft was rejected.
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 font-sans bg-emerald-50 px-2.5 py-1.5 rounded-small border border-emerald-255 self-start">
                  <CheckCircle2 size={14} />
                  <span>Authorized Brief</span>
                </span>
              )}

              {/* Escalation Actions */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto sm:ml-auto">
                <button
                  type="button"
                  onClick={() => activeDraft.status === 'approved' && !isSubmitting && onEscalate(activeDraft.id, 'email')}
                  disabled={activeDraft.status !== 'approved' || isSubmitting}
                  className={cn(
                    'flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-small shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none cursor-pointer min-h-[40px]',
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
                    'flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-small shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none cursor-pointer min-h-[40px]',
                    activeDraft.status === 'approved'
                      ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.98]'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                  )}
                  title={activeDraft.status !== 'approved' ? 'Authorize document before saving.' : 'Save PDF'}
                >
                  <FileDown size={13} />
                  <span>Save PDF</span>
                </button>
              </div>
            </div>
          )}
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
