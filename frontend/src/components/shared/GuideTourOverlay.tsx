import React, { useEffect, useRef, useState } from 'react';
import { useTour } from '@/context/TourContext';
import { tourGroups } from '@/data/tourConfig';
import { Sparkles, HelpCircle, ArrowRight, ArrowLeft, X, ChevronDown, ChevronUp, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Spotlight ────────────────────────────────────────────────────────────────
//
// Passive, pointer-events:none overlay.
// Positioned via fixed coordinates derived from getBoundingClientRect().
// Opacity 0.18 — keeps 90%+ of the UI fully visible.

const Spotlight: React.FC = () => {
  const { highlightRect, isActive } = useTour();

  if (!isActive || !highlightRect) return null;

  const PAD = 6;
  const top = highlightRect.top - PAD;
  const left = highlightRect.left - PAD;
  const width = highlightRect.width + PAD * 2;
  const height = highlightRect.height + PAD * 2;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[9000]"
      style={{ isolation: 'isolate' }}
    >
      {/* Dark mask with cutout via box-shadow */}
      <div
        className="absolute transition-all duration-200"
        style={{
          top,
          left,
          width,
          height,
          borderRadius: 6,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.18)',
          border: '1.5px solid rgba(20,184,166,0.55)', // teal ring
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

// ─── Debug Panel (dev only) ───────────────────────────────────────────────────

const TourDebugPanel: React.FC = () => {
  const {
    fsmState,
    steps,
    currentStepIndex,
    targetRegistry,
    events,
    getTargetElement,
    validateTarget,
    isValidated,
    validationTimedOut,
  } = useTour();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const refresh = () => forceUpdate();
    window.addEventListener('tour-debug-event', refresh);
    window.addEventListener('tour-target-registered', refresh);
    return () => {
      window.removeEventListener('tour-debug-event', refresh);
      window.removeEventListener('tour-target-registered', refresh);
    };
  }, []);

  if (!import.meta.env.DEV) return null;

  const currentStep = steps[currentStepIndex];
  const el = currentStep ? getTargetElement(currentStep.targetId) : null;
  const registryItems = Array.from(targetRegistry.current.entries()).map(([id, element]) => {
    const rect = element.getBoundingClientRect();
    return { id, connected: element.isConnected, visible: validateTarget(element), w: Math.round(rect.width), h: Math.round(rect.height) };
  });

  return (
    <div className="fixed bottom-40 left-4 z-[99999] bg-slate-950 border border-slate-800 text-white rounded font-mono text-[9px] w-72 max-h-[380px] flex flex-col overflow-hidden pointer-events-auto shadow-lg">
      <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(x => !x)}>
        <span className="font-bold uppercase tracking-wider text-teal-400">Tour Debug</span>
        <span>{isExpanded ? '▲' : '▼'}</span>
      </div>
      {isExpanded && (
        <div className="p-2 space-y-2 overflow-y-auto flex-1">
          <div className="bg-slate-900 p-1.5 rounded space-y-0.5">
            <div><span className="text-slate-400">State:</span> <span className="text-teal-400 font-bold">{fsmState}</span></div>
            <div><span className="text-slate-400">Step:</span> <span className="text-amber-400">{currentStep?.id || 'N/A'}</span></div>
            <div><span className="text-slate-400">Validated:</span> <span className={isValidated ? 'text-emerald-400' : 'text-rose-400'}>{isValidated ? '✓' : '✗'}</span></div>
            <div><span className="text-slate-400">Timed out:</span> <span className={validationTimedOut ? 'text-amber-400' : 'text-slate-400'}>{validationTimedOut ? '✓' : '✗'}</span></div>
            <div><span className="text-slate-400">Target el:</span> <span className={el ? 'text-emerald-400' : 'text-rose-400'}>{el ? '✓ found' : '✗ missing'}</span></div>
          </div>
          <div>
            <div className="font-bold text-slate-400 mb-1">REGISTRY ({registryItems.length})</div>
            {registryItems.map(item => (
              <div key={item.id} className="bg-slate-900 px-1.5 py-1 rounded mb-0.5">
                <span className="text-teal-300">{item.id}</span>
                <span className="text-slate-400 ml-2">conn={item.connected ? '1' : '0'} {item.w}×{item.h}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="font-bold text-slate-400 mb-1">EVENTS</div>
            <div className="max-h-24 overflow-y-auto space-y-0.5">
              {events.slice(0, 15).map((evt, i) => (
                <div key={i} className="text-slate-400">
                  <span className="text-amber-400">{evt.type}</span>
                  {evt.details && <span className="text-slate-500"> {evt.details}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Feature Explorer ─────────────────────────────────────────────────────────
//
// Compact jump menu. Each group shows as a tab-like button.
// Clicking a group jumps to its first step.

const FeatureExplorer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { jumpToStep, steps } = useTour();

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-10 animate-fade">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Feature Explorer</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent p-0.5">
          <X size={12} />
        </button>
      </div>
      <div className="p-2 flex flex-wrap gap-1.5">
        {tourGroups.map(group => {
          const firstStepId = group.stepIds[0];
          const idx = steps.findIndex(s => s.id === firstStepId);
          return (
            <button
              key={group.label}
              onClick={() => { jumpToStep(idx >= 0 ? idx : 0); onClose(); }}
              className="px-2.5 py-1.5 text-[10px] font-bold bg-slate-50 border border-slate-200 hover:bg-primary/5 hover:border-primary/40 text-slate-600 hover:text-primary rounded transition-all cursor-pointer"
            >
              {group.label}
            </button>
          );
        })}
      </div>
      <div className="px-3 pb-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
        {steps.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => { jumpToStep(idx); onClose(); }}
            className="text-left text-[9px] text-slate-400 hover:text-primary transition-colors cursor-pointer py-0.5 truncate bg-transparent border-none"
          >
            {idx + 1}. {s.title.replace(/^\d+\.\s*/, '')}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Welcome Modal ─────────────────────────────────────────────────────────────

const WelcomeModal: React.FC = () => {
  const { startTour, skipTour, dontShowAgain } = useTour();

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade font-sans">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-sm w-full p-6 text-center space-y-5 pointer-events-auto">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
          <Sparkles size={22} className="animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-slate-800">Welcome to CivicPulse</h2>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            AI-powered civic accountability platform. Take a 2-minute guided tour of the key features.
          </p>
        </div>
        <div className="space-y-2 pt-1">
          <button
            onClick={startTour}
            className="w-full px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer"
          >
            Start Guided Tour
          </button>
          <button
            onClick={skipTour}
            className="w-full px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            Skip for now
          </button>
          <button
            onClick={dontShowAgain}
            className="w-full px-4 py-1.5 text-slate-400 hover:text-slate-600 text-[10px] font-bold transition-all cursor-pointer bg-transparent border-none"
          >
            Don't show again
          </button>
        </div>
        <div className="border-t border-slate-100 pt-3 text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quick steps</p>
          <ol className="text-[10px] text-slate-500 space-y-0.5 pl-3 list-decimal list-outside font-medium leading-relaxed">
            <li>Select a demo scenario</li>
            <li>Submit a report to see the AI pipeline</li>
            <li>Explore the Tracker and Maps</li>
            <li>Open a Case File and generate a PDF</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

// ─── Completion Modal ──────────────────────────────────────────────────────────

const CompletionModal: React.FC = () => {
  const { skipTour, restartTour } = useTour();

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade font-sans">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-sm w-full p-6 text-center space-y-5 pointer-events-auto">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 mx-auto">
          <Sparkles size={22} />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-800">Tour Complete</h2>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            You've seen the full CivicPulse workflow. The platform is ready for evaluation.
          </p>
        </div>
        <div className="space-y-2">
          <button
            onClick={skipTour}
            className="w-full px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer"
          >
            Explore Freely
          </button>
          <button
            onClick={restartTour}
            className="w-full px-4 py-1.5 text-slate-400 hover:text-slate-600 text-[10px] font-bold transition-all cursor-pointer bg-transparent border-none"
          >
            Restart Tour
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Floating Guide Card ──────────────────────────────────────────────────────
//
// Max height: 120px. Floating bottom-center.
// Shows: title, 1-line description, 1-line why, expected action, progress, controls.

const GuideCard: React.FC = () => {
  const {
    steps,
    currentStepIndex,
    isValidated,
    validationTimedOut,
    nextStep,
    prevStep,
    skipTour,
  } = useTour();

  const [explorerOpen, setExplorerOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStepIndex];
  const totalSteps = steps.length;
  const progress = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  // Close explorer on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setExplorerOpen(false);
      }
    };
    if (explorerOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [explorerOpen]);

  // Keyboard nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && isValidated) nextStep();
      else if (e.key === 'ArrowLeft') prevStep();
      else if (e.key === 'Escape') skipTour();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isValidated, nextStep, prevStep, skipTour]);

  if (!step) return null;

  return (
    <div
      ref={cardRef}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] w-[92vw] max-w-[480px] pointer-events-auto font-sans"
    >
      {/* Feature Explorer popup */}
      {explorerOpen && <FeatureExplorer onClose={() => setExplorerOpen(false)} />}

      {/* Main card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-fade">
        {/* Progress bar */}
        <div className="h-0.5 bg-slate-100">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="px-3 py-2.5 space-y-1.5">
          {/* Row 1: Title + step counter + close */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <HelpCircle size={12} className="text-primary shrink-0" />
              <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide truncate">
                {step.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setExplorerOpen(x => !x)}
                title="Feature Explorer"
                className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded border transition-all cursor-pointer",
                  explorerOpen
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30"
                )}
              >
                {explorerOpen ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
              </button>
              <span className="text-[9px] font-bold text-slate-400">{currentStepIndex + 1}/{totalSteps}</span>
              <button onClick={skipTour} className="text-slate-350 hover:text-slate-600 cursor-pointer border-none bg-transparent p-0.5">
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Row 2: Description */}
          <p className="text-[11px] text-slate-600 leading-snug line-clamp-1">
            {step.description}
          </p>

          {/* Row 3: Why it matters */}
          <p className="text-[10px] text-slate-450 leading-snug line-clamp-1">
            <span className="font-bold text-slate-500">Why: </span>{step.whyItMatters}
          </p>

          {/* Row 4: Expected action */}
          <div className={cn(
            "text-[10px] font-semibold px-2 py-1 rounded border",
            isValidated
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-teal-50/60 border-teal-200/70 text-teal-700"
          )}>
            {isValidated ? '✓ Action complete' : `→ ${step.expectedAction}`}
          </div>

          {/* Row 5: Controls */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-2">
              <button
                onClick={skipTour}
                className="text-[9px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
              >
                Exit guide
              </button>
              {validationTimedOut && !isValidated && (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer border-none bg-transparent"
                >
                  <SkipForward size={9} />
                  Skip step
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="inline-flex items-center gap-0.5 px-2 py-1 border border-slate-200 bg-white text-slate-600 text-[10px] font-bold rounded hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              >
                <ArrowLeft size={10} />
                Back
              </button>
              <button
                onClick={nextStep}
                disabled={!isValidated}
                className={cn(
                  "inline-flex items-center gap-0.5 px-2.5 py-1 text-[10px] font-bold rounded shadow-sm transition-all",
                  isValidated
                    ? "bg-primary hover:bg-primary-hover text-white cursor-pointer"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                {currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
                <ArrowRight size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Error Boundary ────────────────────────────────────────────────────────────

class TourErrorBoundary extends React.Component<
  { children: React.ReactNode; onRestore: () => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) {
    console.error('[GuideTour] Error boundary caught:', error);
    this.props.onRestore();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ─── Root Overlay ─────────────────────────────────────────────────────────────

export const GuideTourOverlayContent: React.FC = () => {
  const { status, showWelcome, isActive } = useTour();

  if (showWelcome && status === 'idle') return <WelcomeModal />;
  if (status === 'completed') return <CompletionModal />;
  if (!isActive) return null;

  return (
    <>
      <Spotlight />
      <GuideCard />
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
