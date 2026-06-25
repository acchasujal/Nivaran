import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, X, AlertCircle, Loader2 } from 'lucide-react';
import { useApproveDraft } from '@/api/queries';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftId: string;
  issueId: string;
  reportCount: number;
  areaLabel: string;
  recipientEmail: string;
  draftType: string;
  onSuccess: (message: string) => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  draftId,
  issueId,
  reportCount,
  areaLabel,
  recipientEmail,
  draftType,
  onSuccess,
}) => {
  const [error, setError] = useState<string | null>(null);
  const approveDraftMutation = useApproveDraft(issueId);
  const modalRef = useRef<HTMLDivElement>(null);

  const getDraftTypeLabel = (type: string) => {
    switch (type) {
      case 'complaint': return 'Official Complaint';
      case 'rti': return 'RTI Request';
      case 'community_summary': return 'Community Brief';
      default: return type;
    }
  };

  const handleApprove = async () => {
    setError(null);
    try {
      await approveDraftMutation.mutateAsync({
        draftId,
        status: 'approved',
      });
      onSuccess('Draft authorized and queued for escalation.');
      onClose();
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.message || 'Failed to approve draft. Please try again.';
      setError(errMsg);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Reset error state on open
    setError(null);

    // ESC closes modal, ENTER confirms
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !approveDraftMutation.isPending) {
        onClose();
      }
      if (e.key === 'Enter' && !approveDraftMutation.isPending) {
        const activeElement = document.activeElement;
        // Trigger approve if the user hasn't explicitly focused Close or Cancel
        if (
          activeElement?.getAttribute('aria-label') !== 'Close modal' &&
          activeElement?.id !== 'cancel-btn'
        ) {
          e.preventDefault();
          handleApprove();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus trap implementation
    const focusableElementsString = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const modal = modalRef.current;
    if (modal) {
      const focusableElements = modal.querySelectorAll(focusableElementsString);
      const firstFocusableElement = focusableElements[0] as HTMLElement;
      const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // Focus the first element initially
      setTimeout(() => {
        firstFocusableElement?.focus();
      }, 50);

      const trapFocus = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) { // Shift + Tab
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            e.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus();
            e.preventDefault();
          }
        }
      };

      modal.addEventListener('keydown', trapFocus);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        modal.removeEventListener('keydown', trapFocus);
      };
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, approveDraftMutation.isPending, draftId]);

  if (!isOpen) return null;

  const isSubmitting = approveDraftMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={() => !isSubmitting && onClose()} 
      />

      {/* Modal Dialog Content */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-subtitle"
        className="relative bg-white border border-secondary-border rounded-large shadow-premium max-w-md w-full p-6 space-y-6 overflow-hidden z-10 pointer-events-auto font-sans"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer rounded-small focus:ring-2 focus:ring-primary focus:outline-none focus:ring-offset-2"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Title Block */}
        <div className="space-y-1">
          <h3 id="modal-title" className="text-base font-bold text-secondary-foreground font-sans">
            Approve Complaint
          </h3>
          <p id="modal-subtitle" className="text-xs text-slate-500 font-sans">
            Review details before approving this complaint.
          </p>
        </div>

        {/* Summary Table */}
        <div className="grid grid-cols-3 gap-y-3 py-4 border-t border-b border-slate-100 text-xs font-sans">
          <div className="text-slate-400 font-semibold">Area</div>
          <div className="col-span-2 text-slate-800 font-medium truncate">{areaLabel}</div>

          <div className="text-slate-400 font-semibold">Nearby Reports</div>
          <div className="col-span-2 text-slate-800 font-medium">{reportCount} {reportCount === 1 ? 'report' : 'reports'}</div>

          <div className="text-slate-400 font-semibold">Recipient</div>
          <div className="col-span-2 text-slate-800 font-medium break-all">{recipientEmail}</div>

          <div className="text-slate-400 font-semibold">Document Type</div>
          <div className="col-span-2 text-slate-800 font-medium">{getDraftTypeLabel(draftType)}</div>
        </div>

        {/* Primary Notice Panel */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-medium text-xs font-sans text-slate-600 space-y-2 select-text leading-relaxed">
          <p>
            You are approving an official complaint representing <strong>{reportCount} reports</strong> for <strong>{areaLabel}</strong>.
          </p>
          <p>
            This complaint will be sent to:
          </p>
          <p className="font-semibold text-slate-800 select-all">
            {recipientEmail}
          </p>
        </div>

        {/* Inline Error Message */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-small text-xs text-rose-700 animate-fade">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span className="font-medium leading-tight">{error}</span>
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-50">
          <button
            id="cancel-btn"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-secondary-border bg-white text-xs font-semibold text-slate-600 rounded-small hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-small shadow-sm transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={13} className="animate-spin shrink-0" />
                <span>Approving...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={13} className="shrink-0" />
                <span>Approve & Continue</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;
