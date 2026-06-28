import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { tourSteps } from '@/data/tourConfig';
import type { TourStep } from '@/data/tourConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TourStatus = 'idle' | 'active' | 'completed';

export interface TourEvent {
  timestamp: string;
  type: string;
  details?: string;
}

interface TourContextType {
  // State
  status: TourStatus;
  currentStepIndex: number;
  steps: TourStep[];
  isActive: boolean;
  showWelcome: boolean;
  isValidated: boolean;
  validationTimedOut: boolean;

  // Target registry (kept for page-level registration)
  registerTourTarget: (id: string, el: HTMLElement | null) => void;
  targetRegistry: React.MutableRefObject<Map<string, HTMLElement>>;
  getTargetElement: (targetId: string) => HTMLElement | null;

  // Spotlight
  highlightRect: DOMRect | null;

  // Issue tracking (passive — read from URL only)
  resolvedIssueId: string | null;
  onIssueSubmitted: (id: string) => void;

  // Controls
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  dontShowAgain: () => void;
  restartTour: () => void;
  jumpToStep: (index: number) => void;

  // Dev debug
  events: TourEvent[];
  addEvent: (type: string, details?: string) => void;

  // Legacy compat
  fsmState: string;
  stepState: 'ready';
  retryCount: 0;
  highlightStyle: null;
  toastMessage: null;
  isTransitioning: false;
  transitionMessage: null;
  errorMsg: null;
  validateTarget: (el: HTMLElement | null) => boolean;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const TourContext = createContext<TourContextType | undefined>(undefined);

export const stepsConfig = tourSteps;

// ─── Provider ──────────────────────────────────────────────────────────────────

const SKIP_TIMEOUT_MS = 30_000;
const VALIDATION_INTERVAL_MS = 500;

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const [status, setStatus] = useState<TourStatus>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [validationTimedOut, setValidationTimedOut] = useState(false);

  // Resolved issue ID — read from URL or set via onIssueSubmitted
  const [resolvedIssueId, setResolvedIssueId] = useState<string | null>(null);

  // Dev event log
  const eventsRef = useRef<TourEvent[]>([]);
  const targetRegistry = useRef<Map<string, HTMLElement>>(new Map());
  const rafRef = useRef<number | null>(null);
  const validationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = tourSteps[currentStepIndex];

  // ── Passive URL tracking: extract issue ID from pathname ──────────────────
  useEffect(() => {
    const match = location.pathname.match(/\/issue\/([^/]+)/);
    if (match && match[1] && match[1] !== ':id') {
      setResolvedIssueId(match[1]);
    }
  }, [location.pathname]);

  const onIssueSubmitted = useCallback((id: string) => {
    setResolvedIssueId(id);
  }, []);

  // ── Dev logger ────────────────────────────────────────────────────────────
  const addEvent = useCallback((type: string, details?: string) => {
    if (!import.meta.env.DEV) return;
    const timestamp = new Date().toLocaleTimeString();
    eventsRef.current = [{ timestamp, type, details }, ...eventsRef.current].slice(0, 100);
    window.dispatchEvent(new CustomEvent('tour-debug-event'));
  }, []);

  // ── Target registration ───────────────────────────────────────────────────
  const registerTourTarget = useCallback((id: string, el: HTMLElement | null) => {
    const existing = targetRegistry.current.get(id);
    if (existing === el) return; // No-op if unchanged
    if (el) {
      targetRegistry.current.set(id, el);
      addEvent('TARGET_REGISTERED', id);
    } else {
      targetRegistry.current.delete(id);
    }
    // Signal for spotlight refresh
    window.dispatchEvent(new CustomEvent('tour-target-registered', { detail: { id } }));
  }, [addEvent]);

  const getTargetElement = useCallback((targetId: string): HTMLElement | null => {
    const registered = targetRegistry.current.get(targetId);
    if (registered && registered.isConnected) return registered;

    // Fallback to CSS selector from config
    const stepConfig = tourSteps.find(s => s.targetId === targetId);
    if (stepConfig?.selector) {
      const el = document.querySelector(stepConfig.selector) as HTMLElement | null;
      if (el) return el;
    }
    return null;
  }, []);

  const validateTarget = useCallback((el: HTMLElement | null): boolean => {
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return true;
  }, []);

  // ── Spotlight: single passive RAF loop, only runs while active ────────────
  const updateSpotlight = useCallback(() => {
    if (!step) { setHighlightRect(null); return; }
    const el = getTargetElement(step.targetId);
    if (el && el.isConnected) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setHighlightRect(rect);
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightRect(null);
    }
  }, [step, getTargetElement]);

  // RAF loop — runs when tour is active
  useEffect(() => {
    if (status !== 'active') {
      setHighlightRect(null);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const loop = () => {
      updateSpotlight();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, updateSpotlight]);

  // ── Validation polling — only when step has validation fn ─────────────────
  const clearValidationTimers = () => {
    if (validationTimerRef.current) { clearInterval(validationTimerRef.current); validationTimerRef.current = null; }
    if (skipTimerRef.current) { clearTimeout(skipTimerRef.current); skipTimerRef.current = null; }
  };

  useEffect(() => {
    if (status !== 'active') { clearValidationTimers(); return; }

    // Reset per-step validation state
    setIsValidated(false);
    setValidationTimedOut(false);

    const validate = step?.validation;
    if (!validate) {
      // No validation needed — Next is always available
      setIsValidated(true);
      return;
    }

    // Run validation check at interval
    const runCheck = () => {
      try {
        if (validate()) {
          setIsValidated(true);
          clearValidationTimers();
          addEvent('VALIDATED', step.id);
        }
      } catch {
        // Ignore validation errors
      }
    };

    runCheck(); // Immediate check
    validationTimerRef.current = setInterval(runCheck, VALIDATION_INTERVAL_MS);

    // Skip timeout
    skipTimerRef.current = setTimeout(() => {
      setValidationTimedOut(true);
      addEvent('VALIDATION_TIMEOUT', step.id);
    }, SKIP_TIMEOUT_MS);

    return () => clearValidationTimers();
  }, [status, currentStepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── isActive / showWelcome ─────────────────────────────────────────────────
  const isActive = status === 'active';
  const showWelcome = status === 'idle' && !localStorage.getItem('civicpulse-tour-dismissed');

  // ── Controls ───────────────────────────────────────────────────────────────
  const startTour = useCallback(() => {
    localStorage.removeItem('civicpulse-tour-dismissed');
    eventsRef.current = [];
    setCurrentStepIndex(0);
    setStatus('active');
    addEvent('START_TOUR');
  }, [addEvent]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < tourSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      addEvent('NEXT_STEP', `${currentStepIndex} → ${currentStepIndex + 1}`);
    } else {
      setStatus('completed');
      addEvent('COMPLETED');
    }
  }, [currentStepIndex, addEvent]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      addEvent('PREV_STEP');
    }
  }, [currentStepIndex, addEvent]);

  const skipTour = useCallback(() => {
    setStatus('idle');
    setHighlightRect(null);
    addEvent('SKIP');
  }, [addEvent]);

  const dontShowAgain = useCallback(() => {
    localStorage.setItem('civicpulse-tour-dismissed', 'true');
    setStatus('idle');
    setHighlightRect(null);
    addEvent('DONT_SHOW_AGAIN');
  }, [addEvent]);

  const restartTour = useCallback(() => {
    localStorage.removeItem('civicpulse-tour-dismissed');
    eventsRef.current = [];
    setCurrentStepIndex(0);
    setStatus('active');
    addEvent('RESTART');
  }, [addEvent]);

  const jumpToStep = useCallback((index: number) => {
    if (index >= 0 && index < tourSteps.length) {
      setCurrentStepIndex(index);
      if (status !== 'active') setStatus('active');
      addEvent('JUMP', `→ ${index}`);
    }
  }, [status, addEvent]);

  // ── Dev global API ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as any).__TOUR__ = {
      status,
      step: tourSteps[currentStepIndex],
      registry: targetRegistry.current,
      events: eventsRef.current,
      next: nextStep,
      back: prevStep,
      restart: restartTour,
      skip: skipTour,
      jump: jumpToStep,
    };
    return () => { delete (window as any).__TOUR__; };
  }, [status, currentStepIndex, nextStep, prevStep, restartTour, skipTour, jumpToStep]);

  return (
    <TourContext.Provider
      value={{
        status,
        currentStepIndex,
        steps: tourSteps,
        isActive,
        showWelcome,
        isValidated,
        validationTimedOut,
        registerTourTarget,
        targetRegistry,
        getTargetElement,
        highlightRect,
        resolvedIssueId,
        onIssueSubmitted,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        dontShowAgain,
        restartTour,
        jumpToStep,
        events: eventsRef.current,
        addEvent,
        // Legacy compat stubs (consumed by existing pages/components)
        fsmState: status === 'idle' ? 'IDLE' : status === 'completed' ? 'COMPLETED' : 'TOOLTIP_VISIBLE',
        stepState: 'ready',
        retryCount: 0,
        highlightStyle: null,
        toastMessage: null,
        isTransitioning: false,
        transitionMessage: null,
        errorMsg: null,
        validateTarget,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) throw new Error('useTour must be used within a TourProvider');
  return context;
};
