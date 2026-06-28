import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Collapsible Floating Debug Panel (Dev-only)
const TourDebugPanel: React.FC = () => {
  const {
    fsmState,
    steps,
    currentStepIndex,
    targetRegistry,
    retryCount,
    events,
    getTargetElement,
    validateTarget
  } = useTour();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);

  useEffect(() => {
    const handleRefresh = () => forceUpdate();
    window.addEventListener('tour-debug-event', handleRefresh);
    window.addEventListener('tour-target-registered', handleRefresh);
    return () => {
      window.removeEventListener('tour-debug-event', handleRefresh);
      window.removeEventListener('tour-target-registered', handleRefresh);
    };
  }, []);

  useEffect(() => {
    setElapsed(0);
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 100);
    return () => clearInterval(interval);
  }, [fsmState, currentStepIndex]);

  if (!import.meta.env.DEV) return null;

  const currentStep = steps[currentStepIndex];
  const targetId = currentStep?.targetId;
  const el = targetId ? getTargetElement(targetId) : null;
  const isRegistered = !!el;
  const isValid = validateTarget(el);

  // Get registry items
  const registryItems = Array.from(targetRegistry.current.entries()).map(([id, element]) => {
    const rect = element.getBoundingClientRect();
    const isConn = element.isConnected;
    const isVal = validateTarget(element);
    return {
      id,
      connected: isConn,
      visible: isVal,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      x: Math.round(rect.left),
      y: Math.round(rect.top),
    };
  });

  return (
    <div className="fixed bottom-4 left-4 z-[99999] bg-slate-950 border border-slate-850 text-white rounded-medium shadow-premium font-mono text-[9px] w-80 max-h-[450px] flex flex-col overflow-hidden pointer-events-auto">
      <div 
        className="px-3 py-2 bg-slate-900 border-b border-slate-850 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-bold uppercase tracking-wider text-teal-400">Tour Debugger</span>
        <span>{isExpanded ? 'Collapse ▲' : 'Expand ▼'}</span>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-4 overflow-y-auto flex-1 scrollbar-thin max-h-[400px]">
          {/* Status Metrics */}
          <div className="space-y-1 bg-slate-900 p-2 rounded border border-slate-800">
            <div><span className="text-slate-450">Step:</span> <span className="text-amber-400 font-bold">{currentStep?.id || 'N/A'}</span></div>
            <div><span className="text-slate-450">FSM State:</span> <span className="text-teal-400 font-bold">{fsmState}</span></div>
            <div><span className="text-slate-450">Route:</span> <span className="text-slate-300">{window.location.pathname}</span></div>
            <div><span className="text-slate-450">Target ID:</span> <span className="text-slate-300">{targetId || 'N/A'}</span></div>
            <div><span className="text-slate-450">Registered:</span> <span className={isRegistered ? 'text-emerald-400' : 'text-rose-400'}>{isRegistered ? '✓' : '✗'}</span></div>
            <div><span className="text-slate-450">Visible/Valid:</span> <span className={isValid ? 'text-emerald-400' : 'text-rose-400'}>{isValid ? '✓' : '✗'}</span></div>
            <div><span className="text-slate-450">Tooltip Visible:</span> <span>{fsmState === 'TOOLTIP_VISIBLE' ? '✓' : '✗'}</span></div>
            <div><span className="text-slate-450">Retries:</span> <span className="text-rose-455 font-bold">{retryCount}</span></div>
            <div><span className="text-slate-450">Elapsed Time:</span> <span className="text-teal-450 font-bold">{elapsed}ms</span></div>
          </div>

          {/* Registry Inspector */}
          <div className="space-y-1">
            <div className="font-bold text-slate-450 border-b border-slate-800 pb-0.5">REGISTRY ({registryItems.length})</div>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {registryItems.length === 0 ? (
                <div className="text-slate-500 italic">No targets registered</div>
              ) : (
                registryItems.map(item => (
                  <div key={item.id} className="bg-slate-900 p-1.5 rounded border border-slate-800 space-y-0.5">
                    <div className="font-bold text-teal-300">{item.id}</div>
                    <div className="text-slate-400">
                      conn={item.connected ? '1' : '0'} vis={item.visible ? '1' : '0'} size={item.width}x{item.height} pos={item.x},{item.y}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Event Timeline */}
          <div className="space-y-1 flex flex-col min-h-[100px]">
            <div className="font-bold text-slate-450 border-b border-slate-800 pb-0.5">EVENT TIMELINE</div>
            <div className="space-y-1 max-h-36 overflow-y-auto flex-1 pr-1">
              {events.length === 0 ? (
                <div className="text-slate-500 italic">No events logged</div>
              ) : (
                events.map((evt, idx) => (
                  <div key={idx} className="border-b border-slate-900 pb-1">
                    <span className="text-slate-500">[{evt.timestamp}]</span>{' '}
                    <span className="text-amber-400 font-bold">{evt.type}</span>
                    {evt.details && <div className="text-slate-400 leading-normal pl-2">{evt.details}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const GuideTourOverlayContent: React.FC = () => {
  const navigate = useNavigate();
  const {
    fsmState,
    steps,
    currentStepIndex,
    highlightStyle,
    toastMessage,
    isTransitioning,
    transitionMessage,
    showWelcome,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    dontShowAgain,
    restartTour
  } = useTour();

  const step = steps[currentStepIndex];

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (fsmState === 'IDLE' || fsmState === 'COMPLETED') return;
      if (e.key === 'ArrowRight') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      } else if (e.key === 'Escape') {
        skipTour();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fsmState, currentStepIndex]);

  // Render toast for recovery messaging
  const renderToast = () => {
    if (!toastMessage) return null;
    return (
      <div className="fixed bottom-5 right-5 z-[99999] bg-slate-900 border border-slate-800 text-white rounded-medium px-4 py-3 shadow-premium text-xs font-bold animate-fade font-sans select-none border">
        <span>{toastMessage}</span>
      </div>
    );
  };

  // Render Route Transition Overlay
  if (isTransitioning && transitionMessage) {
    return (
      <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-xs flex items-center justify-center p-4 z-[998] pointer-events-auto">
        <div className="bg-white border border-slate-200/80 rounded-medium shadow-md px-4 py-2.5 flex items-center gap-2.5 select-none animate-fade">
          <Loader2 className="animate-spin text-primary" size={15} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
            {transitionMessage}
          </span>
        </div>
        <TourDebugPanel />
      </div>
    );
  }

  // Render Completion Modal
  if (fsmState === 'COMPLETED') {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade font-sans max-h-screen overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-medium shadow-premium max-w-sm w-full p-6 text-center space-y-5 my-4 pointer-events-auto">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 shrink-0">
            <Sparkles size={22} />
          </div>
          <div className="space-y-1 select-none">
            <h2 className="text-base font-bold text-slate-800">You're ready to evaluate CivicPulse</h2>
            <p className="text-[11px] text-slate-400 font-semibold leading-normal">
              You have completed the guided onboarding tour.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            <button
              onClick={() => {
                skipTour();
                navigate('/tracker');
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-small shadow-sm transition-all cursor-pointer"
            >
              Explore Tracker
            </button>
            <button
              onClick={() => {
                skipTour();
                navigate('/');
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-small transition-all cursor-pointer"
            >
              Submit Another Report
            </button>
            <button
              onClick={restartTour}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-slate-400 hover:text-slate-600 text-[10px] font-bold transition-all cursor-pointer font-sans"
            >
              Restart Tour
            </button>
          </div>
        </div>
        <TourDebugPanel />
      </div>
    );
  }

  // Render Welcome Modal
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
              <li>Watch the AI pipeline</li>
              <li>Open Tracker</li>
              <li>Explore AI Civic Insights</li>
              <li>Click a Ward</li>
              <li>Inspect the Silence Ledger</li>
              <li>Open a complaint</li>
              <li>Edit the draft</li>
              <li>Generate PDF</li>
              <li>Send Email</li>
            </ol>
          </div>
        </div>
        <TourDebugPanel />
      </div>
    );
  }

  // If tour is inactive or transitioning target
  if (fsmState === 'IDLE' || fsmState === 'NAVIGATING' || fsmState === 'WAITING_FOR_ROUTE' || fsmState === 'WAITING_FOR_SUSPENSE' || fsmState === 'WAITING_FOR_RENDER' || fsmState === 'WAITING_FOR_TARGET') {
    return (
      <>
        {renderToast()}
        {fsmState !== 'IDLE' && (
          <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-xs flex items-center justify-center p-4 z-[998] pointer-events-auto">
            <div className="bg-white border border-slate-200/80 rounded-medium shadow-md px-4 py-2.5 flex items-center gap-2.5 select-none">
              <Loader2 className="animate-spin text-primary" size={15} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                Loading Tour Step...
              </span>
            </div>
          </div>
        )}
        <TourDebugPanel />
      </>
    );
  }

  if (!step) return renderToast();

  const totalSteps = steps.length;
  const currentStepNum = currentStepIndex + 1;
  const progressPercentage = Math.round((currentStepNum / totalSteps) * 100);

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

          {/* Progress Bar Component */}
          <div className="w-full space-y-1 pt-0.5 select-none">
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wide">
              <span>Step {currentStepNum} of {totalSteps}</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
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
                onClick={nextStep}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-sm cursor-pointer"
              >
                <span>{currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <TourDebugPanel />
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
