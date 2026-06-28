import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { tourSteps } from '@/data/tourConfig';
import type { TourStep } from '@/data/tourConfig';

export type TourFsmState =
  | 'IDLE'
  | 'CLEANUP'
  | 'NAVIGATING'
  | 'WAITING_FOR_ROUTE'
  | 'WAITING_FOR_SUSPENSE'
  | 'WAITING_FOR_RENDER'
  | 'WAITING_FOR_TARGET'
  | 'SCROLLING'
  | 'MEASURING'
  | 'HIGHLIGHTING'
  | 'TOOLTIP_VISIBLE'
  | 'COMPLETED'
  | 'FAILED_RECOVERY';

export type TourStatus = 'idle' | 'welcome' | 'loading' | 'active' | 'error';
export type StepState = 'waiting-route' | 'waiting-target' | 'ready';

export interface TourEvent {
  timestamp: string;
  type: string;
  details?: string;
}

interface TourContextType {
  // Granular FSM State
  fsmState: TourFsmState;
  
  // Backward compatibility fields
  status: TourStatus;
  stepState: StepState;
  currentStepIndex: number;
  steps: TourStep[];
  isActive: boolean;
  showWelcome: boolean;
  
  // Target registry
  registerTourTarget: (id: string, el: HTMLElement | null) => void;
  targetRegistry: React.MutableRefObject<Map<string, HTMLElement>>;

  // Overlay state coordinates & styles
  highlightStyle: React.CSSProperties | null;
  toastMessage: string | null;

  // Route transition state
  isTransitioning: boolean;
  transitionMessage: string | null;

  // Issue dynamic tracking
  resolvedIssueId: string | null;
  onIssueSubmitted: (id: string) => void;

  // Controls
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  dontShowAgain: () => void;
  restartTour: () => void;
  errorMsg: string | null;

  // Debugging & Observability
  events: TourEvent[];
  addEvent: (type: string, details?: string) => void;
  retryCount: number;
  getTargetElement: (targetId: string) => HTMLElement | null;
  validateTarget: (el: HTMLElement | null) => boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const stepsConfig = tourSteps; // Backward-compatible export alias

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [fsmState, setFsmState] = useState<TourFsmState>('IDLE');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);
  const [resolvedIssueId, setResolvedIssueId] = useState<string | null>(null);
  const [errorMsg] = useState<string | null>(null);

  // Debug event history log
  const eventsRef = useRef<TourEvent[]>([]);

  // Refs for tracking mutable states without re-triggering effects
  const targetRegistry = useRef<Map<string, HTMLElement>>(new Map());
  const recentlySubmittedIssueIdRef = useRef<string | null>(null);
  const targetRouteRef = useRef<string>('');
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  const step = tourSteps[currentStepIndex];

  // Helper: check if dismissed on mount
  useEffect(() => {
    const dismissed = localStorage.getItem('civicpulse-tour-dismissed');
    if (dismissed === 'true') {
      setFsmState('IDLE');
    } else {
      setFsmState('IDLE');
    }
  }, []);

  // Listen to path changes to automatically capture submitted issue IDs
  useEffect(() => {
    const pathMatch = location.pathname.match(/\/issue\/([^/]+)/);
    if (pathMatch && pathMatch[1] && pathMatch[1] !== ':id') {
      recentlySubmittedIssueIdRef.current = pathMatch[1];
    }
  }, [location.pathname]);

  // Expose manual submission callback
  const onIssueSubmitted = useCallback((id: string) => {
    recentlySubmittedIssueIdRef.current = id;
    window.dispatchEvent(new CustomEvent('tour-report-submitted', { detail: { id } }));
  }, []);

  // Debug Logger Helper
  const addEvent = useCallback((type: string, details?: string) => {
    if (!import.meta.env.DEV) return;
    const timestamp = new Date().toLocaleTimeString();
    eventsRef.current = [{ timestamp, type, details }, ...eventsRef.current].slice(0, 100);
    window.dispatchEvent(new CustomEvent('tour-debug-event'));
  }, []);

  // Prune disconnected DOM targets
  const pruneStaleTargets = useCallback(() => {
    let prunedAny = false;
    for (const [id, el] of targetRegistry.current.entries()) {
      if (!el || !el.isConnected) {
        targetRegistry.current.delete(id);
        prunedAny = true;
        addEvent('TARGET_PRUNED', `Stale ID pruned: ${id}`);
      }
    }
    return prunedAny;
  }, [addEvent]);

  // Target registration handler
  const registerTourTarget = useCallback((id: string, el: HTMLElement | null) => {
    const existing = targetRegistry.current.get(id) || null;
    if (existing === el) {
      return; // Do nothing if reference hasn't changed to prevent React update loops
    }

    pruneStaleTargets();
    if (el) {
      targetRegistry.current.set(id, el);
      addEvent('TARGET_REGISTERED', `ID: ${id}`);
    } else {
      targetRegistry.current.delete(id);
      addEvent('TARGET_UNREGISTERED', `ID: ${id}`);
    }
    // Dispatch a custom event so FSM waiting for target reacts instantly
    window.dispatchEvent(new CustomEvent('tour-target-registered', { detail: { id, element: el } }));
  }, [pruneStaleTargets, addEvent]);

  // Map FSM states to backward compatible fields
  const status: TourStatus =
    fsmState === 'IDLE'
      ? 'idle'
      : fsmState === 'FAILED_RECOVERY'
      ? 'error'
      : fsmState === 'WAITING_FOR_ROUTE' || fsmState === 'NAVIGATING'
      ? 'loading'
      : 'active';

  const stepState: StepState =
    fsmState === 'TOOLTIP_VISIBLE'
      ? 'ready'
      : fsmState === 'WAITING_FOR_ROUTE'
      ? 'waiting-route'
      : 'waiting-target';

  const isActive = fsmState !== 'IDLE' && fsmState !== 'COMPLETED';
  const showWelcome = fsmState === 'IDLE' && !localStorage.getItem('civicpulse-tour-dismissed');

  // Resolve dynamic route issue parameter using priority fallback chain
  const resolveDynamicIssueId = async (): Promise<string> => {
    if (recentlySubmittedIssueIdRef.current) {
      return recentlySubmittedIssueIdRef.current;
    }
    const pathParts = window.location.pathname.match(/\/issue\/([^/]+)/);
    if (pathParts && pathParts[1] && pathParts[1] !== ':id') {
      return pathParts[1];
    }
    try {
      const cached = queryClient.getQueryData<any>(['issues', {}]);
      if (cached && cached.issues && cached.issues.length > 0) {
        return cached.issues[0].id;
      }
    } catch (e) {}
    try {
      const res = await apiClient.get<any>('/issues');
      if (res.data && res.data.issues && res.data.issues.length > 0) {
        return res.data.issues[0].id;
      }
    } catch (e) {}
    return 'iss-001';
  };

  const getTargetElement = (targetId: string): HTMLElement | null => {
    const el = targetRegistry.current.get(targetId);
    if (el && el.isConnected) {
      return el;
    }
    const currentStep = tourSteps.find(s => s.targetId === targetId);
    if (currentStep && currentStep.selector) {
      const elFromSelector = document.querySelector(currentStep.selector) as HTMLElement;
      if (elFromSelector) {
        return elFromSelector;
      }
    }
    return null;
  };

  const validateTarget = (el: HTMLElement | null): boolean => {
    if (!el) return false;
    if (!el.isConnected) return false;

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;

    const style = window.getComputedStyle(el);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      parseFloat(style.opacity || '1') === 0
    ) {
      return false;
    }

    if (el.hasAttribute('data-loading') || el.querySelector('[data-loading]')) {
      return false;
    }

    return true;
  };

  const getTransitionMessageForRoute = (route: string): string => {
    if (route === '/') return 'Opening Incident Report Intake...';
    if (route === '/tracker') return 'Loading Operations Tracker...';
    if (route.startsWith('/issue/')) return 'Opening Case Operation File...';
    return 'Navigating...';
  };

  const lockScrolling = () => {
    document.body.style.overflow = 'hidden';
  };

  const restoreScrolling = () => {
    document.body.style.overflow = '';
  };

  // Dev Global API attachment
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).__TOUR__ = {
        state: fsmState,
        step: tourSteps[currentStepIndex],
        registry: targetRegistry.current,
        events: eventsRef.current,
        next: () => nextStep(),
        back: () => prevStep(),
        restart: () => restartTour(),
        skip: () => skipTour(),
        highlight: (id: string) => {
          const el = getTargetElement(id);
          if (el) {
            const rect = el.getBoundingClientRect();
            setHighlightStyle({
              top: `${rect.top + window.scrollY - 8}px`,
              left: `${rect.left + window.scrollX - 8}px`,
              width: `${rect.width + 16}px`,
              height: `${rect.height + 16}px`,
              position: 'absolute',
            });
          }
        }
      };
    }
    return () => {
      if (import.meta.env.DEV) {
        delete (window as any).__TOUR__;
      }
    };
  }, [fsmState, currentStepIndex]);

  // Promise-based Synchronization Helpers
  const waitForRoute = (targetRoute: string, abortSignal: AbortSignal, timeoutMs = 3000): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (location.pathname === targetRoute) {
        resolve();
        return;
      }

      const checkInterval = setInterval(() => {
        if (abortSignal.aborted) {
          clearInterval(checkInterval);
          reject(new Error('Navigation waiting aborted'));
          return;
        }
        if (location.pathname === targetRoute) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      const timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error(`Timeout waiting for route match: ${targetRoute}`));
      }, timeoutMs);

      abortSignal.addEventListener('abort', () => {
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        reject(new Error('Navigation waiting aborted'));
      });
    });
  };

  const waitForTarget = (targetId: string, abortSignal: AbortSignal, timeoutMs = 3000): Promise<HTMLElement> => {
    return new Promise((resolve, reject) => {
      const el = getTargetElement(targetId);
      const isCustomValid = validateTarget(el) && (!step.validation || step.validation(el));

      if (isCustomValid) {
        resolve(el!);
        return;
      }

      const check = () => {
        const currentEl = getTargetElement(targetId);
        const isValid = validateTarget(currentEl) && (!step.validation || step.validation(currentEl));
        if (isValid) {
          window.removeEventListener('tour-target-registered', handleRegistered);
          resolve(currentEl!);
          return true;
        }
        return false;
      };

      const handleRegistered = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail.id === targetId) {
          check();
        }
      };

      window.addEventListener('tour-target-registered', handleRegistered);

      const checkInterval = setInterval(() => {
        if (abortSignal.aborted) {
          clearInterval(checkInterval);
          window.removeEventListener('tour-target-registered', handleRegistered);
          reject(new Error('Target waiting aborted'));
          return;
        }
        if (check()) {
          clearInterval(checkInterval);
        }
      }, 100);

      const timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        window.removeEventListener('tour-target-registered', handleRegistered);
        reject(new Error(`Timeout waiting for target registry element: ${targetId}`));
      }, timeoutMs);

      abortSignal.addEventListener('abort', () => {
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        window.removeEventListener('tour-target-registered', handleRegistered);
        reject(new Error('Target waiting aborted'));
      });
    });
  };

  const waitForLayoutStabilize = (el: HTMLElement, abortSignal: AbortSignal, timeoutMs = 3000): Promise<void> => {
    return new Promise((resolve, reject) => {
      let lastRect = el.getBoundingClientRect();
      let consecutiveFrames = 0;
      let rafId: number;

      const checkFrame = () => {
        if (abortSignal.aborted) {
          reject(new Error('Layout stabilization aborted'));
          return;
        }

        const rect = el.getBoundingClientRect();
        const unchanged = (
          rect.top === lastRect.top &&
          rect.left === lastRect.left &&
          rect.width === lastRect.width &&
          rect.height === lastRect.height
        );

        if (unchanged && rect.width > 0 && rect.height > 0) {
          consecutiveFrames++;
        } else {
          consecutiveFrames = 0;
          lastRect = rect;
        }

        if (consecutiveFrames >= 2) {
          resolve();
        } else {
          rafId = requestAnimationFrame(checkFrame);
        }
      };

      rafId = requestAnimationFrame(checkFrame);

      const timeoutId = setTimeout(() => {
        cancelAnimationFrame(rafId);
        resolve(); // Fallback resolve to prevent infinite lock
      }, timeoutMs);

      abortSignal.addEventListener('abort', () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timeoutId);
        reject(new Error('Layout stabilization aborted'));
      });
    });
  };

  // Main FSM Controller Effect Loop
  useEffect(() => {
    let active = true;
    let resizeObserver: ResizeObserver | null = null;

    // Create abort controller for current FSM state execution
    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;

    const transitionTo = (nextState: TourFsmState, reason?: string) => {
      if (active) {
        if (import.meta.env.DEV) {
          const r = reason || 'state transition';
          const targetEl = getTargetElement(step?.targetId);
          const found = !!targetEl;
          const valid = validateTarget(targetEl);
          console.log(`[Tour FSM] ${fsmState} -> ${nextState} | Reason: ${r} | Route: ${location.pathname} | Step: ${step?.id}`);
          const timestamp = new Date().toLocaleTimeString();
          eventsRef.current = [
            {
              timestamp,
              type: 'FSM_TRANSITION',
              details: `${fsmState} -> ${nextState} | Reason: ${r} | targetFound=${found} | validation=${valid}`
            },
            ...eventsRef.current
          ].slice(0, 100);
          window.dispatchEvent(new CustomEvent('tour-debug-event'));
        }
        setFsmState(nextState);
      }
    };

    const runState = async () => {
      if (!step || fsmState === 'IDLE') {
        setHighlightStyle(null);
        restoreScrolling();
        return;
      }

      switch (fsmState) {
        case 'CLEANUP': {
          setHighlightStyle(null);
          // Scroll cancel recovery
          window.scrollTo({ top: window.scrollY });
          restoreScrolling();

          let nextRoute = step.route;
          if (step.route.includes(':id')) {
            const id = await resolveDynamicIssueId();
            setResolvedIssueId(id);
            nextRoute = step.route.replace(':id', id);
          } else {
            setResolvedIssueId(null);
          }
          targetRouteRef.current = nextRoute;
          transitionTo('NAVIGATING', 'Dynamic target route resolved: ' + nextRoute);
          break;
        }

        case 'NAVIGATING': {
          const targetRoute = targetRouteRef.current || step.route;

          if (step.beforeEnter) {
            await step.beforeEnter();
          }

          if (location.pathname !== targetRoute) {
            setTransitionMessage(getTransitionMessageForRoute(targetRoute));
            setIsTransitioning(true);
            navigate(targetRoute);
            transitionTo('WAITING_FOR_ROUTE', 'Triggered route change');
          } else {
            transitionTo('WAITING_FOR_SUSPENSE', 'Already on target route');
          }
          break;
        }

        case 'WAITING_FOR_ROUTE': {
          const targetRoute = targetRouteRef.current || step.route;
          try {
            await waitForRoute(targetRoute, abortController.signal, 3000);
            setIsTransitioning(false);
            setTransitionMessage(null);
            transitionTo('WAITING_FOR_SUSPENSE', 'Route matched');
          } catch (e: any) {
            if (active && !abortController.signal.aborted) {
              console.warn(e.message);
              transitionTo('FAILED_RECOVERY', 'Route mismatch recovery');
            }
          }
          break;
        }

        case 'WAITING_FOR_SUSPENSE': {
          const isSuspenseLoading = !!document.querySelector('[data-loading="page"]');
          if (!isSuspenseLoading) {
            transitionTo('WAITING_FOR_RENDER', 'Suspense loaded');
          } else {
            const checkInterval = setInterval(() => {
              if (abortController.signal.aborted) {
                clearInterval(checkInterval);
                return;
              }
              const loading = document.querySelector('[data-loading="page"]');
              if (!loading) {
                clearInterval(checkInterval);
                transitionTo('WAITING_FOR_RENDER', 'Suspense resolved');
              }
            }, 100);

            // Timeout fallback
            setTimeout(() => {
              clearInterval(checkInterval);
              if (active && !abortController.signal.aborted) {
                transitionTo('WAITING_FOR_RENDER', 'Suspense fallback timeout');
              }
            }, 3000);
          }
          break;
        }

        case 'WAITING_FOR_RENDER': {
          try {
            await new Promise((r, reject) => {
              const handle = requestAnimationFrame(() => requestAnimationFrame(r));
              abortController.signal.addEventListener('abort', () => {
                cancelAnimationFrame(handle);
                reject(new Error('Render check aborted'));
              });
            });
            transitionTo('WAITING_FOR_TARGET', 'Render complete');
          } catch (e) {}
          break;
        }

        case 'WAITING_FOR_TARGET': {
          const isPageLoading = !!document.querySelector('[data-loading="page"]');
          const hasLoader = document.querySelector('[data-loading]') || getTargetElement(step.targetId);
          const maxWait = (isPageLoading || hasLoader) ? 15000 : 3000;

          try {
            await waitForTarget(step.targetId, abortController.signal, maxWait);
            transitionTo('SCROLLING', 'Target resolved successfully');
          } catch (e: any) {
            if (active && !abortController.signal.aborted) {
              console.warn(e.message);
              if (step.onMissingTarget) {
                step.onMissingTarget();
              }
              transitionTo('FAILED_RECOVERY', 'Target matching timeout');
            }
          }
          break;
        }

        case 'SCROLLING': {
          const el = getTargetElement(step.targetId);
          if (el) {
            lockScrolling();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });

            try {
              await waitForLayoutStabilize(el, abortController.signal, 3000);
              transitionTo('MEASURING', 'Scroll layout stabilized');
            } catch (e: any) {
              if (active && !abortController.signal.aborted) {
                transitionTo('MEASURING', 'Scroll stabilization timeout');
              }
            }
          } else {
            transitionTo('WAITING_FOR_TARGET', 'Scroll target missing');
          }
          break;
        }

        case 'MEASURING': {
          const el = getTargetElement(step.targetId);
          if (el) {
            const rect = el.getBoundingClientRect();
            // Safe measurement validation
            if (rect.width <= 0 || rect.height <= 0 || isNaN(rect.top) || isNaN(rect.left)) {
              requestAnimationFrame(runState);
              return;
            }
            setHighlightStyle({
              top: `${rect.top + window.scrollY - 8}px`,
              left: `${rect.left + window.scrollX - 8}px`,
              width: `${rect.width + 16}px`,
              height: `${rect.height + 16}px`,
              position: 'absolute',
            });
            transitionTo('HIGHLIGHTING', 'Spotlight measured');
          } else {
            transitionTo('WAITING_FOR_TARGET', 'Measuring failed: target missing');
          }
          break;
        }

        case 'HIGHLIGHTING':
          transitionTo('TOOLTIP_VISIBLE', 'Highlight coordinates rendered');
          break;

        case 'TOOLTIP_VISIBLE': {
          const el = getTargetElement(step.targetId);
          if (!el || !validateTarget(el)) {
            transitionTo('WAITING_FOR_TARGET', 'Target lost or invalidated while visible');
            return;
          }

          resizeObserver = new ResizeObserver(() => {
            if (active && el) {
              const rect = el.getBoundingClientRect();
              setHighlightStyle({
                top: `${rect.top + window.scrollY - 8}px`,
                left: `${rect.left + window.scrollX - 8}px`,
                width: `${rect.width + 16}px`,
                height: `${rect.height + 16}px`,
                position: 'absolute',
              });
            }
          });
          resizeObserver.observe(el);

          if (step.afterEnter) {
            await step.afterEnter();
          }
          break;
        }

        case 'FAILED_RECOVERY': {
          setHighlightStyle(null);
          restoreScrolling();
          setToastMessage("This feature couldn't be highlighted automatically.");
          
          setTimeout(() => {
            if (active && !abortController.signal.aborted) {
              setToastMessage(null);
              if (currentStepIndex < tourSteps.length - 1) {
                setCurrentStepIndex(prev => prev + 1);
                setRetryCount(0);
                transitionTo('CLEANUP', 'Recovery: advancing to next step');
              } else {
                transitionTo('COMPLETED', 'Recovery: end of tour reached');
              }
            }
          }, 2500);
          break;
        }

        case 'COMPLETED':
          setHighlightStyle(null);
          restoreScrolling();
          break;
      }
    };

    runState();

    return () => {
      active = false;
      abortController.abort();
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [fsmState, currentStepIndex, resolvedIssueId, location.pathname, addEvent]);

  // Controls API
  const startTour = () => {
    localStorage.removeItem('civicpulse-tour-dismissed');
    setCurrentStepIndex(0);
    eventsRef.current = [];
    window.dispatchEvent(new CustomEvent('tour-debug-event'));
    addEvent('START_TOUR', 'Guided Tour started');
    setFsmState('CLEANUP');
  };

  const nextStep = async () => {
    if (step && step.canAdvance) {
      const allowed = await step.canAdvance();
      if (!allowed) {
        addEvent('ADVANCE_BLOCKED', 'canAdvance() returned false');
        return;
      }
    }

    addEvent('ADVANCE_STEP', `Moving from step index ${currentStepIndex}`);
    if (currentStepIndex < tourSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setFsmState('CLEANUP');
    } else {
      setFsmState('COMPLETED');
    }
  };

  const prevStep = () => {
    addEvent('PREV_STEP', `Moving back from step index ${currentStepIndex}`);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setFsmState('CLEANUP');
    }
  };

  const skipTour = () => {
    addEvent('SKIP_TOUR', 'Guided Tour skipped');
    setFsmState('IDLE');
  };

  const dontShowAgain = () => {
    localStorage.setItem('civicpulse-tour-dismissed', 'true');
    addEvent('DONT_SHOW_AGAIN', 'Guided Tour dismissed permanently');
    setFsmState('IDLE');
  };

  const restartTour = () => {
    addEvent('RESTART_TOUR', 'Guided Tour restarted');
    startTour();
  };

  return (
    <TourContext.Provider
      value={{
        fsmState,
        status,
        stepState,
        currentStepIndex,
        steps: tourSteps,
        isActive,
        showWelcome,
        registerTourTarget,
        targetRegistry,
        highlightStyle,
        toastMessage,
        isTransitioning,
        transitionMessage,
        resolvedIssueId,
        onIssueSubmitted,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        dontShowAgain,
        restartTour,
        errorMsg,
        events: eventsRef.current,
        addEvent,
        retryCount,
        getTargetElement,
        validateTarget,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

export default TourProvider;
