import React, { useState, useEffect, useRef } from 'react';
import { useTour } from '@/context/TourContext';
import { getStepPhase, tourPhases, explorerFeatures } from '@/data/tourConfig';
import { Sparkles, ArrowRight, ArrowLeft, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Spotlight ────────────────────────────────────────────────────────────────

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
      {/* Dark mask with cutout via box-shadow (low opacity 0.15 for high visibility and non-blocking clicks) */}
      <div
        className="absolute transition-all duration-200"
        style={{
          top,
          left,
          width,
          height,
          borderRadius: 6,
          boxShadow: '0 0 0 9999px rgba(15,23,42,0.15)',
          border: '1.5px solid rgba(20,184,166,0.6)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

// ─── Welcome Banner Component ────────────────────────────────────────────────

export const TourWelcomeBanner: React.FC = () => {
  const { status, showWelcome, startTour, dontShowAgain } = useTour();
  const [viewStepsOpen, setViewStepsOpen] = useState(false);

  if (!showWelcome || status !== 'idle') return null;

  return (
    <div className="w-full bg-slate-50 border-b border-slate-200 py-2.5 px-6 flex flex-col transition-all z-40 select-none animate-fade">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs shrink-0 font-extrabold text-teal-650 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded uppercase tracking-wider">
            🚀 Quick Start
          </span>
          <span className="text-xs text-slate-600 font-medium truncate">
            Complete this 5-minute evaluation to explore CivicPulse.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          <button
            onClick={() => setViewStepsOpen(x => !x)}
            className="px-2.5 py-1 text-[11px] font-bold text-slate-655 bg-white border border-slate-250 rounded hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>View Phases</span>
            {viewStepsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          <button
            onClick={startTour}
            className="px-3 py-1 text-[11px] font-bold text-white bg-primary hover:bg-primary-hover rounded shadow-sm transition-colors cursor-pointer"
          >
            Start Evaluation Guide
          </button>
          <button
            onClick={dontShowAgain}
            className="px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-605 transition-colors bg-transparent border-none cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>

      {viewStepsOpen && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-5 gap-3">
          {tourPhases.map(phase => (
            <div key={phase.number} className="bg-white border border-slate-150 rounded p-2 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-[8px]">Phase {phase.number}</span>
              <span className="text-[10px] font-bold text-slate-705 mt-0.5">{phase.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Feature Explorer Checklist ──────────────────────────────────────────────

const FeatureExplorer: React.FC = () => {
  const { completedFeatures, jumpToStep, steps } = useTour();
  const [isOpen, setIsOpen] = useState(false);

  const total = explorerFeatures.length;
  const done = explorerFeatures.filter(f => completedFeatures[f.id]).length;

  return (
    <div className="fixed bottom-4 right-4 z-[9995] font-sans pointer-events-auto select-none">
      {/* Small floating status badge */}
      <button
        onClick={() => setIsOpen(x => !x)}
        className={cn(
          "px-3.5 py-2 rounded-full border shadow-premium font-bold text-[11px] flex items-center gap-2 transition-all active:scale-[0.97] cursor-pointer",
          isOpen
            ? "bg-slate-900 border-slate-800 text-white"
            : "bg-white border-slate-200 text-slate-700 hover:border-slate-350"
        )}
      >
        <Sparkles size={12} className={cn("text-primary", done === total && "text-emerald-500 animate-pulse")} />
        <span>Platform Overview ({done}/{total})</span>
        {isOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>

      {/* Expanded vertical checklist panel */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-slate-200 rounded-xl shadow-premium p-3 space-y-2 animate-fade max-h-[380px] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Platform Overview</span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer border-none bg-transparent">
              <X size={12} />
            </button>
          </div>
          <div className="space-y-1">
            {explorerFeatures.map(feat => {
              const isChecked = !!completedFeatures[feat.id];
              const stepIdx = steps.findIndex(s => s.id === feat.stepId);
              return (
                <button
                  key={feat.id}
                  disabled={isChecked}
                  onClick={() => {
                    if (stepIdx >= 0) {
                      jumpToStep(stepIdx);
                    }
                  }}
                  className={cn(
                    "w-full text-left flex items-center justify-between px-2 py-1.5 rounded transition-all text-[10px] border border-transparent",
                    isChecked
                      ? "bg-emerald-50/55 text-emerald-800 cursor-default opacity-85"
                      : "bg-slate-50 hover:bg-primary/5 hover:border-primary/20 text-slate-650 font-bold cursor-pointer"
                  )}
                >
                  <span className="truncate">{feat.label}</span>
                  {isChecked ? (
                    <span className="text-emerald-650 font-extrabold text-[10px] shrink-0">✓ Checked</span>
                  ) : (
                    <span className="text-primary hover:underline text-[9px] shrink-0">Explore →</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Floating Tooltip Card ───────────────────────────────────────────────────

const GuideCard: React.FC = () => {
  const {
    steps,
    currentStepIndex,
    isValidated,
    validationTimedOut,
    nextStep,
    prevStep,
    skipTour,
    highlightRect,
    completedFeatures,
  } = useTour();

  const step = steps[currentStepIndex];
  const totalSteps = steps.length;
  const phase = step ? getStepPhase(step.id) : null;

  // Inactivity auto-collapse logic:
  const [isCollapsed, setIsCollapsed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    setIsCollapsed(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsCollapsed(true);
    }, 10000); // 10 seconds of inactivity
  };

  useEffect(() => {
    resetTimer();
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetTimer));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [currentStepIndex]);

  // Collision detection reposition helper
  const getCardStyle = (): React.CSSProperties => {
    const cardWidth = 480;
    const cardHeight = 110;
    const padding = 16;

    if (!highlightRect) {
      return {
        position: 'fixed',
        top: `${padding}px`,
        right: `${padding}px`,
        width: '92vw',
        maxWidth: `${cardWidth}px`,
      };
    }

    // Default target box (top-right):
    const trLeft = window.innerWidth - cardWidth - padding;
    const trRight = window.innerWidth - padding;
    const trTop = padding;
    const trBottom = padding + cardHeight;

    // Check overlap with highlightRect:
    const hrLeft = highlightRect.left;
    const hrRight = highlightRect.right;
    const hrTop = highlightRect.top;
    const hrBottom = highlightRect.bottom;

    const overlapsTopRight = !(
      hrRight < trLeft ||
      hrLeft > trRight ||
      hrBottom < trTop ||
      hrTop > trBottom
    );

    if (overlapsTopRight) {
      // If target is in top-right, try top-left:
      const tlLeft = padding;
      const tlRight = padding + cardWidth;
      const overlapsTopLeft = !(
        hrRight < tlLeft ||
        hrLeft > tlRight ||
        hrBottom < trTop ||
        hrTop > trBottom
      );

      if (overlapsTopLeft) {
        // If both overlap, float at bottom-center:
        return {
          position: 'fixed',
          bottom: `${padding}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '92vw',
          maxWidth: `${cardWidth}px`,
        };
      }

      return {
        position: 'fixed',
        top: `${padding}px`,
        left: `${padding}px`,
        width: '92vw',
        maxWidth: `${cardWidth}px`,
      };
    }

    return {
      position: 'fixed',
      top: `${padding}px`,
      right: `${padding}px`,
      width: '92vw',
      maxWidth: `${cardWidth}px`,
    };
  };

  if (!step || !phase) return null;

  const totalTasks = explorerFeatures.length;
  const completedTasks = explorerFeatures.filter(f => completedFeatures[f.id]).length;

  if (isCollapsed) {
    return (
      <button
        onClick={() => {
          setIsCollapsed(false);
          resetTimer();
        }}
        style={getCardStyle()}
        className="z-[9990] bg-slate-900 border border-slate-800 text-white rounded-full shadow-premium px-4 py-2 flex items-center justify-between text-xs font-bold transition-all cursor-pointer pointer-events-auto hover:bg-slate-800 select-none animate-fade w-[220px]"
      >
        <span>Evaluation Guide ({completedTasks}/{totalTasks})</span>
        <ChevronDown size={14} className="animate-bounce" />
      </button>
    );
  }

  return (
    <div
      style={getCardStyle()}
      className="z-[9990] bg-white border border-slate-200 rounded-xl shadow-premium overflow-hidden select-none animate-fade pointer-events-auto max-w-[480px] max-h-[110px]"
    >
      {/* Top progress line */}
      <div className="h-0.5 bg-slate-100">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%` }}
        />
      </div>

      <div className="px-3.5 py-2 flex flex-col justify-between h-[107px]">
        {/* Row 1: Title, phase, close */}
        <div className="flex items-center justify-between gap-2 min-w-0 select-none">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[9px] font-extrabold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded tracking-wide uppercase shrink-0">
              Phase {phase.number} • {phase.name}
            </span>
            <span className="text-[11px] font-extrabold text-slate-850 uppercase tracking-wide truncate">
              {step.title}
            </span>
          </div>
          <button onClick={skipTour} className="text-slate-350 hover:text-slate-655 transition-colors p-0.5 cursor-pointer border-none bg-transparent shrink-0">
            <X size={13} />
          </button>
        </div>

        {/* Row 2 & 3: Description, why, expected action */}
        <div className="space-y-0.5">
          <p className="text-[10px] text-slate-600 leading-tight line-clamp-1">
            {step.description} <span className="font-semibold text-slate-400 ml-1">Why: {step.whyItMatters}</span>
          </p>

          <div className={cn(
            "text-[9.5px] font-bold px-2 py-0.5 rounded border flex items-center justify-between transition-all",
            isValidated
              ? "bg-emerald-50 border-emerald-250 text-emerald-800 animate-pulse"
              : "bg-teal-50/50 border-teal-200/50 text-teal-750"
          )}>
            <span className="truncate">
              {isValidated ? '✓ Completed' : `→ ${step.expectedAction}`}
            </span>
            {validationTimedOut && !isValidated && (
              <button
                onClick={nextStep}
                className="text-[9px] font-bold text-amber-600 hover:text-amber-800 cursor-pointer border-none bg-transparent"
              >
                Skip this step
              </button>
            )}
          </div>
        </div>

        {/* Row 4: Controls footer */}
        <div className="flex items-center justify-between select-none border-t border-slate-100 pt-1">
          <button
            onClick={skipTour}
            className="text-[9.5px] font-bold text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer"
          >
            Skip Guide
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 border border-slate-200 bg-white text-slate-600 text-[10px] font-bold rounded hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ArrowLeft size={10} />
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={!isValidated}
              className={cn(
                "inline-flex items-center gap-0.5 px-2.5 py-0.5 text-[10px] font-bold rounded shadow-sm transition-all",
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
  );
};

// ─── Completion Modal ──────────────────────────────────────────────────────────

const CompletionModal: React.FC = () => {
  const { skipTour, restartTour } = useTour();

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade font-sans select-none">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-sm w-full p-6 text-center space-y-5 pointer-events-auto">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-250 mx-auto">
          <Sparkles size={22} />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-800">Evaluation Completed!</h2>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            All 5 phases of the evaluation guide are complete. Feel free to explore further.
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
            Restart Evaluation Guide
          </button>
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
    console.error('[EvaluationGuide] Error boundary caught:', error);
    this.props.onRestore();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ─── Root Overlay ─────────────────────────────────────────────────────────────

export const GuideTourOverlayContent: React.FC = () => {
  const { status, isActive } = useTour();

  return (
    <>
      <Spotlight />
      {isActive && <GuideCard />}
      {status === 'completed' && <CompletionModal />}
      <FeatureExplorer />
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
