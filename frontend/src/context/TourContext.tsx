import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface TourStep {
  id: number;
  route: string;
  selector: string;
  title: string;
  description: string;
  whyItMatters: string;
  whatIsThis: string;
  whyIsUseful: string;
  howImproveAccountability: string;
  footerNote?: string;
}

export type TourStatus = 'idle' | 'welcome' | 'loading' | 'active' | 'error';
export type StepState = 'waiting-route' | 'waiting-target' | 'ready';

interface TourContextType {
  status: TourStatus;
  stepState: StepState;
  currentStepIndex: number;
  steps: TourStep[];
  isActive: boolean;
  showWelcome: boolean;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  dontShowAgain: () => void;
  restartTour: () => void;
  errorMsg: string | null;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const stepsConfig: TourStep[] = [
  {
    id: 1,
    route: '/',
    selector: '#demo-scenario-select',
    title: '1. Choose a Demo Scenario',
    description: 'Start by selecting one of the provided demo scenarios. Each scenario loads realistic civic infrastructure evidence so you can immediately experience the complete CivicPulse workflow.',
    whyItMatters: 'Loads realistic demo data instantly without requiring you to source your own photos.',
    whatIsThis: 'Sensible demo incident templates.',
    whyIsUseful: 'Initiates a realistic workflow in one click.',
    howImproveAccountability: 'Enables immediate evaluation of the processing pipeline.',
    footerNote: 'You may also upload your own image at any time to test the platform.'
  },
  {
    id: 2,
    route: '/',
    selector: '#photo-uploader-container',
    title: '2. Upload Your Own Evidence',
    description: 'Upload any infrastructure photo to test the AI pipeline with your own data. Supported types include road damage, garbage, streetlights, water leaks, footpaths, construction, drainage, trees, and manholes.',
    whyItMatters: 'Allows citizens to either continue with the guided demo scenarios or upload their own real image.',
    whatIsThis: 'Direct file intake uploader.',
    whyIsUseful: 'Allows testing with live real-world evidence.',
    howImproveAccountability: 'Grants citizens direct access to report unique visual proofs.'
  },
  {
    id: 3,
    route: '/tracker',
    selector: '#operations-map-container',
    title: '3. Google Maps',
    description: 'Visualizes geolocated reports with dynamic clustering and color-coded markers based on risk level.',
    whyItMatters: 'Highlights cluster density to help officials prioritize systemic issues.',
    whatIsThis: 'Interactive GIS operations map.',
    whyIsUseful: 'Shows issue hotspots instantly.',
    howImproveAccountability: 'Prevents ignoring concentrated neighborhood failures.'
  },
  {
    id: 4,
    route: '/tracker',
    selector: '#transparency-dashboard-stats',
    title: '4. Public Transparency Dashboard',
    description: 'Displays real-time platform metrics, tracking total reports, AI verification status, and resolutions.',
    whyItMatters: 'Builds public trust by showing the pipeline status of every single submission.',
    whatIsThis: 'Platform-wide metric counter.',
    whyIsUseful: 'Provides high-level audit summary.',
    howImproveAccountability: 'Allows citizens to hold municipal departments accountable.'
  },
  {
    id: 5,
    route: '/tracker',
    selector: '#ai-civic-insights-card',
    title: '5. AI Civic Insights',
    description: 'Converts raw data into concise, actionable spatial intelligence using deterministic aggregation.',
    whyItMatters: 'Identifies major infrastructure failures across wards automatically.',
    whatIsThis: 'Evidence-based aggregation summaries.',
    whyIsUseful: 'Highlights key operational trends.',
    howImproveAccountability: 'Pinpoints specific wards needing urgent attention.'
  },
  {
    id: 6,
    route: '/tracker',
    selector: '#silence-ledger-container',
    title: '6. Cross-Issue Silence Ledger',
    description: 'Summarizes unresolved issues and tracks cumulative waiting time for notified authorities.',
    whyItMatters: 'Forces transparency on government delay by exposing exactly how long issues remain ignored.',
    whatIsThis: 'Delinquency and waiting time ledger.',
    whyIsUseful: 'Quantifies bureaucratic delays.',
    howImproveAccountability: 'Creates public pressure with evidence-based wait times.'
  },
  {
    id: 7,
    route: '/tracker',
    selector: '#ward-pattern-container',
    title: '7. Ward Pattern Intelligence',
    description: 'Visualizes pattern distributions across active wards to reveal systemic utility failures.',
    whyItMatters: 'Shows that issues are ward-wide infrastructure deficits, not isolated incidents.',
    whatIsThis: 'Evidence aggregation by ward.',
    whyIsUseful: 'Tracks ward-level failure patterns.',
    howImproveAccountability: 'Enables policy-level intervention instead of single fixes.'
  },
  {
    id: 8,
    route: '/issue/iss-001',
    selector: '#evidence-integrity-badge',
    title: '8. Evidence Integrity Badge',
    description: 'Uses perceptual hashing to verify if an uploaded image is unique or a visual duplicate.',
    whyItMatters: 'Shields the platform from spam while preserving genuine nearby submissions.',
    whatIsThis: 'Perceptual hashing verification.',
    whyIsUseful: 'Automatically flags duplicate spam.',
    howImproveAccountability: 'Guarantees only genuine evidence is escalated.'
  },
  {
    id: 9,
    route: '/issue/iss-001',
    selector: '#agent-timeline-container',
    title: '9. Agent Timeline',
    description: 'Tracks the backend reasoning steps of the 5-agent pipeline from intake to brief compilation.',
    whyItMatters: 'Provides absolute explainability on how AI analyzed and structured the case details.',
    whatIsThis: '5-agent reasoning history trail.',
    whyIsUseful: 'Reveals decision transparency.',
    howImproveAccountability: 'Ensures the AI reasoning path can be audited.'
  },
  {
    id: 10,
    route: '/issue/iss-001',
    selector: '#community-verification-container',
    title: '10. Community Verification',
    description: 'Allows nearby residents to corroborate reports, upload photos, and add comments.',
    whyItMatters: 'Leverages crowdsourced validation to strengthen and verify the report\'s urgency.',
    whatIsThis: 'Crowdsourced verification panel.',
    whyIsUseful: 'Builds community consensus.',
    howImproveAccountability: 'Mitigates fraud via citizen peer validation.'
  },
  {
    id: 11,
    route: '/issue/iss-001',
    selector: '#ai-recommendations-container',
    title: '11. AI Recommendations',
    description: 'Suggests target department, priority levels, and escalation timeline based on severity.',
    whyItMatters: 'Guides citizens on the most effective legal and administrative route for resolution.',
    whatIsThis: 'Strategic next-step advisor.',
    whyIsUseful: 'Identifies correct department routes.',
    howImproveAccountability: 'Standardizes escalations using regulatory windows.'
  },
  {
    id: 12,
    route: '/issue/iss-001',
    selector: '#complaint-draft-workspace',
    title: '12. Complaint Draft',
    description: 'An interactive workspace to edit and preview AI-generated complaints and RTI briefs.',
    whyItMatters: 'Keeps citizens in control, allowing them to refine facts before official submission.',
    whatIsThis: 'Editable document workspace.',
    whyIsUseful: 'Allows human review of AI drafts.',
    howImproveAccountability: 'Secures high-quality legal brief submissions.'
  },
  {
    id: 13,
    route: '/issue/iss-001',
    selector: '#government-response-tracker',
    title: '13. Government Response Tracker',
    description: 'Tracks post-submission statutory response windows (e.g. 30-day RTI reply cycle).',
    whyItMatters: 'Notifies citizens when response limits expire, prompting standard next actions.',
    whatIsThis: 'Statutory deadline tracker.',
    whyIsUseful: 'Flags unresponsive officials.',
    howImproveAccountability: 'Enforces statutory timelines on civic entities.'
  },
  {
    id: 14,
    route: '/issue/iss-001',
    selector: '#accountability-timeline-container',
    title: '14. Accountability Timeline',
    description: 'Models the complete lifecycle from evidence collection to final verification and closure.',
    whyItMatters: 'Tracks the exact progression steps of both citizens and officials.',
    whatIsThis: 'End-to-end lifecycle log.',
    whyIsUseful: 'Clarifies resolving milestones.',
    howImproveAccountability: 'Ensures visible, chronological tracking of case progress.'
  },
  {
    id: 15,
    route: '/issue/iss-001',
    selector: '#pdf-email-actions',
    title: '15. PDF + Email Actions',
    description: 'Enables official complaint submission via direct email or PDF export.',
    whyItMatters: 'Bridges online citizen verification with formal municipal grievance channels.',
    whatIsThis: 'Official dispatch control panel.',
    whyIsUseful: 'Sends legal briefs directly.',
    howImproveAccountability: 'Ensures complaints reach authorities with legal weight.'
  }
];

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState<TourStatus>('welcome');
  const [stepState, setStepState] = useState<StepState>('waiting-route');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errorMsg] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const step = stepsConfig[currentStepIndex];

  useEffect(() => {
    // Check localStorage on load
    const dismissed = localStorage.getItem('civicpulse-tour-dismissed');
    if (dismissed === 'true') {
      setStatus('idle');
    }
  }, []);

  // Centralized Scroll Lock
  useEffect(() => {
    if (status === 'active' && stepState === 'ready') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [status, stepState]);

  // Route & Target monitoring FSM effect
  useEffect(() => {
    if (status !== 'active' || !step) return;

    let active = true;
    let pollInterval: any = null;
    let timeoutId: any = null;

    const checkTarget = () => {
      if (!active) return;
      const element = document.querySelector(step.selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        if (isVisible) {
          clearInterval(pollInterval);
          clearTimeout(timeoutId);
          setStepState('ready');
          setRetryCount(0);
          return;
        }
      }
    };

    const handleTransition = () => {
      if (location.pathname !== step.route) {
        setStepState('waiting-route');
        navigate(step.route);
        return;
      }

      setStepState('waiting-target');
      pollInterval = setInterval(checkTarget, 100);

      // Timeout of 3.5 seconds for target resolution
      timeoutId = setTimeout(() => {
        clearInterval(pollInterval);
        if (!active) return;

        console.warn(`Tour step target "${step.selector}" missing on route "${step.route}".`);

        if (retryCount < 2) {
          setRetryCount(prev => prev + 1);
          setStepState('waiting-route'); // trigger re-eval
        } else {
          setRetryCount(0);
          // Skip toast dispatch
          window.dispatchEvent(new CustomEvent('civicpulse-tour-skip-toast', {
            detail: { message: "This section isn't available right now. Continuing the tour." }
          }));

          if (currentStepIndex < stepsConfig.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
          } else {
            setStatus('idle');
          }
        }
      }, 3500);
    };

    handleTransition();

    return () => {
      active = false;
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [currentStepIndex, status, location.pathname, step]);

  const startTour = () => {
    setStatus('active');
    setCurrentStepIndex(0);
    setStepState('waiting-route');
  };

  const nextStep = () => {
    if (currentStepIndex < stepsConfig.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setStepState('waiting-route');
    } else {
      skipTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setStepState('waiting-route');
    }
  };

  const skipTour = () => {
    setStatus('idle');
    setStepState('waiting-route');
  };

  const dontShowAgain = () => {
    localStorage.setItem('civicpulse-tour-dismissed', 'true');
    skipTour();
  };

  const restartTour = () => {
    setStatus('active');
    setCurrentStepIndex(0);
    setStepState('waiting-route');
  };

  return (
    <TourContext.Provider
      value={{
        status,
        stepState,
        currentStepIndex,
        steps: stepsConfig,
        isActive: status === 'active',
        showWelcome: status === 'welcome',
        startTour,
        nextStep,
        prevStep,
        skipTour,
        dontShowAgain,
        restartTour,
        errorMsg,
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
