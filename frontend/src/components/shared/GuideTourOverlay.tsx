import React, { useEffect, useState } from 'react';
import { useTour } from '@/context/TourContext';
import { Sparkles, HelpCircle, ArrowRight, ArrowLeft, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Global Error Boundary to prevent crashes from locking down UI
class TourErrorBoundary extends React.Component<{ children: React.ReactNode; onRestore: () => void }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Guided Tour Error Boundary caught exception:', error, errorInfo);
    this.props.onRestore();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-5 right-5 z-[9999] bg-slate-900 border border-slate-800 text-white rounded-medium p-4 shadow-premium text-xs font-bold font-sans select-none animate-fade">
          ⚠️ Onboarding tour encountered a layout error. Guide restarted.
        </div>
      );
    }
    return this.props.children;
  }
}

export const GuideTourOverlayContent: React.FC = () => {
  const {
    status,
    stepState,
    currentStepIndex,
    steps,
    isActive,
    showWelcome,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    dontShowAgain
  } = useTour();

  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const step = steps[currentStepIndex];

  // Listen for recovery / skip toasts
  useEffect(() => {
    const handleSkipToast = (e: Event) => {
      const message = (e as CustomEvent).detail?.message || '';
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 3000);
    };

    window.addEventListener('civicpulse-tour-skip-toast', handleSkipToast);
    return () => window.removeEventListener('civicpulse-tour-skip-toast', handleSkipToast);
  }, []);

  // Spotlight measurement and safe auto scroll
  useEffect(() => {
    if (status !== 'active' || stepState !== 'ready' || !step) {
      setHighlightStyle(null);
      return;
    }

    let active = true;
    const measureAndScroll = async () => {
      if (!active) return;
      const element = document.querySelector(step.selector) as HTMLElement;
      if (!element) return;

      // Safe Auto Scroll
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Wait for scrolling to settle
      await new Promise(resolve => setTimeout(resolve, 350));

      if (!active) return;
      const rect = element.getBoundingClientRect();
      
      // Enforce valid layout bounds before rendering spotlight
      if (rect.width > 0 && rect.height > 0) {
        setHighlightStyle({
          top: `${rect.top + window.scrollY - 8}px`,
          left: `${rect.left + window.scrollX - 8}px`,
          width: `${rect.width + 16}px`,
          height: `${rect.height + 16}px`,
          position: 'absolute',
        });
      } else {
        setHighlightStyle(null);
      }
    };

    // Initial positioning
    measureAndScroll();

    // Listen to window adjustments
    window.addEventListener('resize', measureAndScroll);
    window.addEventListener('scroll', measureAndScroll);

    return () => {
      active = false;
      window.removeEventListener('resize', measureAndScroll);
      window.removeEventListener('scroll', measureAndScroll);
    };
  }, [currentStepIndex, status, stepState, step]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'active') return;
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      } else if (e.key === 'Escape') {
        skipTour();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex === 0) {
      // Auto-trigger default selection when leaving first step (effortless onboarding flow)
      window.dispatchEvent(new CustomEvent('civicpulse-tour-select-default'));
    }
    nextStep();
  };

  if (showWelcome) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade font-sans max-h-screen overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-medium shadow-premium max-w-sm w-full p-6 text-center space-y-5 my-4 pointer-events-auto">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 animate-pulse">
            <Sparkles size={22} />
          </div>
          <div className="space-y-1 select-none">
            <h2 className="text-base font-bold text-slate-800">Welcome to CivicPulse</h2>
            <p className="text-[11px] text-slate-400 font-semibold leading-normal">
              AI-powered civic infrastructure intelligence platform.
            </p>
            <p className="text-[10px] text-slate-400 block pt-1">
              Estimated walkthrough: 2–3 minutes.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            <button
              onClick={startTour}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-small shadow-sm transition-all cursor-pointer"
            >
              Start Guided Tour
            </button>
            <button
              onClick={skipTour}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-small transition-all cursor-pointer"
            >
              Skip
            </button>
            <button
              onClick={dontShowAgain}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-slate-400 hover:text-slate-600 text-[10px] font-bold transition-all cursor-pointer"
            >
              Don't show again
            </button>
          </div>

          <div className="border-t border-slate-100 pt-3.5 text-left space-y-2 select-none">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Quick Start</span>
              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Recommended (≈5 min)</span>
            </div>
            <ol className="text-[10px] text-slate-500 space-y-1 pl-1 list-decimal list-inside font-medium leading-normal">
              <li>Select a Demo Scenario</li>
              <li>Submit a demo report</li>
              <li>Watch the 5-agent AI pipeline</li>
              <li>Open the Public Tracker</li>
              <li>Explore AI Civic Insights</li>
              <li>Click a Ward Pattern card</li>
              <li>Inspect the Silence Ledger</li>
              <li>Open a complaint</li>
              <li>Edit the AI draft</li>
              <li>Generate the PDF</li>
              <li>Send the official complaint email</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Render toast for recovery messaging
  const renderToast = () => {
    if (!toastMessage) return null;
    return (
      <div className="fixed bottom-5 right-5 z-[99999] bg-slate-900 border border-slate-800 text-white rounded-medium px-4 py-3 shadow-premium text-xs font-bold animate-fade font-sans select-none border">
        <span>{toastMessage}</span>
      </div>
    );
  };

  if (!isActive || !step) return renderToast();

  // Route and target loading states (prevent locked scrolling or missing tooltips during transitions)
  if (stepState !== 'ready') {
    return (
      <>
        {renderToast()}
        {/* Soft, non-blocking dim backdrop */}
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-xs flex items-center justify-center p-4 z-[998] pointer-events-auto">
          <div className="bg-white border border-slate-200/80 rounded-medium shadow-md px-4 py-2.5 flex items-center gap-2.5 select-none">
            <Loader2 className="animate-spin text-primary" size={15} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
              Loading Tour Step...
            </span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {renderToast()}
      <div className="fixed inset-0 pointer-events-none z-[99] select-none font-sans">
        {/* Background Mask Overlay */}
        <div className="absolute inset-0 bg-slate-950/45 fixed pointer-events-auto cursor-default z-[998]" onClick={skipTour} />

        {/* Spotlight highlight window on target */}
        {highlightStyle && (
          <div
            style={highlightStyle}
            className="ring-[9999px] ring-slate-950/45 border-2 border-primary rounded-medium shadow-premium transition-all duration-300 pointer-events-none z-[998]"
          />
        )}

        {/* Floating Info card */}
        <div
          className={cn(
            "pointer-events-auto bg-white border border-slate-250 rounded-medium shadow-premium max-w-sm w-[90%] md:w-96 p-5 flex flex-col space-y-4 z-[999] animate-fade",
            highlightStyle 
              ? "absolute mt-4" 
              : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          )}
          style={highlightStyle ? {
            top: `${parseFloat(highlightStyle.top as string) + parseFloat(highlightStyle.height as string)}px`,
            left: `min(calc(100vw - 410px), max(16px, ${parseFloat(highlightStyle.left as string)}px))`,
          } : undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 text-primary">
              <HelpCircle size={15} />
              <span className="text-xs font-extrabold uppercase tracking-wider">{step.title}</span>
            </div>
            <button 
              onClick={skipTour} 
              className="text-slate-400 hover:text-slate-600 rounded p-0.5 cursor-pointer border-none bg-transparent"
            >
              <X size={14} />
            </button>
          </div>

          {/* Explanatory Texts */}
          <div className="space-y-3 text-xs leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-800">{step.description}</p>
            <div className="p-2.5 bg-slate-50 border border-slate-150 rounded text-[11px] text-slate-500 font-medium">
              <strong className="text-slate-700 block mb-0.5">Why it matters:</strong>
              {step.whyItMatters}
            </div>
            <div className="border-t border-slate-100 pt-2 space-y-1 text-[10px] text-slate-450 leading-normal">
              <div><span className="font-bold text-slate-500">What is this?</span> {step.whatIsThis}</div>
              <div><span className="font-bold text-slate-500">Why useful?</span> {step.whyIsUseful}</div>
              <div><span className="font-bold text-slate-500">Civic Accountability:</span> {step.howImproveAccountability}</div>
            </div>
            {step.footerNote && (
              <div className="text-[10px] text-slate-400 italic pt-1 leading-normal border-t border-slate-100/50">
                Note: {step.footerNote}
              </div>
            )}
          </div>

          {/* Buttons Controls */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <button 
              onClick={skipTour}
              className="text-slate-450 hover:text-slate-600 font-bold cursor-pointer border-none bg-transparent"
            >
              Skip
            </button>
            <div className="flex gap-2">
              <button
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-255 bg-white text-slate-700 font-bold rounded hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
              >
                <ArrowLeft size={12} />
                <span>Back</span>
              </button>
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-sm cursor-pointer"
              >
                <span>{currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const GuideTourOverlay: React.FC = () => {
  const { skipTour } = useTour();
  return (
    <TourErrorBoundary onRestore={skipTour}>
      <GuideTourOverlayContent />
    </TourErrorBoundary>
  );
};

export default GuideTourOverlay;
