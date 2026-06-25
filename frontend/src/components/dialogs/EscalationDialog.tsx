import React, { useState, useEffect, useRef } from 'react';
import { Send, FileDown, X, AlertCircle, Loader2 } from 'lucide-react';

interface EscalationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (recipientEmail?: string) => Promise<void> | void;
  method: 'email' | 'pdf_export';
  isSubmitting?: boolean;
}

export const EscalationDialog: React.FC<EscalationDialogProps> = ({
  isOpen,
  onClose,
  onSend,
  method,
  isSubmitting = false,
}) => {
  const [email, setEmail] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (method === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim()) {
        setError('Recipient email is required.');
        return;
      }
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    if (!confirmed) {
      setError('Please check the confirmation box to proceed.');
      return;
    }

    try {
      await onSend(method === 'email' ? email.trim() : undefined);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail?.provider_response || err?.response?.data?.detail || err?.message || 'Escalation dispatch failed.';
      setError(errorMsg);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setConfirmed(false);
    if (method === 'email') {
      setEmail('');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus trap implementation
    const focusableElementsString = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const dialog = dialogRef.current;
    if (dialog) {
      const focusableElements = dialog.querySelectorAll(focusableElementsString);
      const firstFocusableElement = focusableElements[0] as HTMLElement;
      const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

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

      dialog.addEventListener('keydown', trapFocus);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        dialog.removeEventListener('keydown', trapFocus);
      };
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, method]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={() => !isSubmitting && onClose()} 
      />

      {/* Dialog box container */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="relative bg-white border border-secondary-border rounded-large shadow-premium max-w-md w-full p-6 space-y-5 overflow-hidden z-10 pointer-events-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer rounded-small focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-3 text-slate-700">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-full shrink-0">
            {method === 'email' ? <Send size={18} /> : <FileDown size={18} />}
          </div>
          <h3 className="text-base font-bold text-secondary-foreground font-sans">
            {method === 'email' ? 'Dispatch Escalation Email' : 'Export Escalation PDF Package'}
          </h3>
        </div>

        {/* Dialog Form */}
        <form onSubmit={validateAndSubmit} className="space-y-4">
          {method === 'email' && (
            <div className="space-y-1">
              <label htmlFor="recipientEmail" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Recipient Authority Email
              </label>
              <input
                id="recipientEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ward.office@example.gov"
                className="w-full text-sm border border-secondary-border rounded-small px-3 py-2 bg-slate-50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Warning / Explanation note */}
          <p className="text-[11px] text-slate-500 leading-relaxed font-sans select-text">
            {method === 'email'
              ? 'This will trigger Agent 5 to dispatch the approved escalation brief to the designated authority email address using SendGrid. The real-world response state will be recorded.'
              : 'This will trigger Agent 5 to compile the approved escalation brief into an official PDF document and output a static download URL.'}
          </p>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-small">
            <input
              id="confirmEscalation"
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
              disabled={isSubmitting}
            />
            <label htmlFor="confirmEscalation" className="text-[11px] text-slate-600 font-medium select-none cursor-pointer leading-tight">
              I confirm that the draft has been reviewed and is ready for real-world dispatch.
            </label>
          </div>

          {/* Validation Alert */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-small text-xs text-rose-700 animate-fade">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span className="font-semibold leading-tight">{error}</span>
            </div>
          )}

          {/* Buttons Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 border border-secondary-border bg-white text-xs font-semibold text-slate-600 rounded-small hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-small shadow transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={12} className="animate-spin shrink-0" />
                  <span>{method === 'email' ? 'Sending...' : 'Exporting...'}</span>
                </>
              ) : (
                <>
                  {method === 'email' ? <Send size={12} /> : <FileDown size={12} />}
                  <span>{method === 'email' ? 'Dispatch Email' : 'Generate PDF'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EscalationDialog;
