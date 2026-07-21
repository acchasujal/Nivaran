import React, { createContext, useContext, useState } from 'react';
import { Toast, type FeedbackTone } from '../../design-system/primitives/feedback/Snackbar';
import { LoadingIndicator } from '../../design-system/primitives/feedback/LoadingIndicator';

export interface ToastItem {
  id: string;
  message: string;
  tone?: FeedbackTone;
  actionLabel?: string;
  onAction?: () => void;
}

export interface FeedbackContextType {
  showToast: (message: string, tone?: FeedbackTone, actionLabel?: string, onAction?: () => void) => void;
  showGlobalLoading: (label?: string) => void;
  hideGlobalLoading: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loadingState, setLoadingState] = useState<{ active: boolean; label?: string }>({ active: false });

  const showToast = (message: string, tone: FeedbackTone = 'info', actionLabel?: string, onAction?: () => void) => {
    const id = `toast-${Date.now()}`;
    const newToast: ToastItem = { id, message, tone, actionLabel, onAction };
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const showGlobalLoading = (label = 'Processing request...') => {
    setLoadingState({ active: true, label });
  };

  const hideGlobalLoading = () => {
    setLoadingState({ active: false });
  };

  return (
    <FeedbackContext.Provider value={{ showToast, showGlobalLoading, hideGlobalLoading }}>
      {children}

      {/* Global Toast Portal */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast
              message={t.message}
              tone={t.tone}
              actionLabel={t.actionLabel}
              onAction={t.onAction}
              onDismiss={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            />
          </div>
        ))}
      </div>

      {/* Full Page Loading Overlay */}
      {loadingState.active && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center animate-fade">
          <div className="bg-white p-6 rounded-lg shadow-modal border border-neutral-200 text-center">
            <LoadingIndicator label={loadingState.label} size="lg" />
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};
