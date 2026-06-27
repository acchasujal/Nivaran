import React, { useEffect, useState, useRef } from 'react';
import { useTour } from '@/context/TourContext';
import { Sparkles, HelpCircle, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStepData {
  targetId: string;
  title: string;
  explanation: string;
  whyItMatters: string;
  whatIsThis: string;
  whyIsUseful: string;
  howImproveAccountability: string;
  footerNote?: string;
}

const stepsData: Record<number, TourStepData> = {
  1: {
    targetId: 'demo-scenario-select',
    title: '1. Choose a Demo Scenario',
    explanation: 'Start by selecting one of the provided demo scenarios. Each scenario loads realistic civic infrastructure evidence so you can immediately experience the complete CivicPulse workflow.',
    whyItMatters: 'Loads realistic demo data instantly without requiring you to source your own photos.',
    whatIsThis: 'Sensible demo incident templates.',
    whyIsUseful: 'Initiates a realistic workflow in one click.',
    howImproveAccountability: 'Enables immediate evaluation of the processing pipeline.',
    footerNote: 'You may also upload your own image at any time to test the platform.'
  },
  2: {
    targetId: 'photo-uploader-container',
    title: '2. Upload Your Own Evidence',
    explanation: 'Upload any infrastructure photo to test the AI pipeline with your own data. Supported types include road damage, garbage, streetlights, water leaks, footpaths, construction, drainage, trees, and manholes.',
    whyItMatters: 'Allows citizens to either continue with the guided demo scenarios or upload their own real image.',
    whatIsThis: 'Direct file intake uploader.',
    whyIsUseful: 'Allows testing with live real-world evidence.',
    howImproveAccountability: 'Grants citizens direct access to report unique visual proofs.'
  },
  3: {
    targetId: 'operations-map-container',
    title: '3. Google Maps',
    explanation: 'Visualizes geolocated reports with dynamic clustering and color-coded markers based on risk level.',
    whyItMatters: 'Highlights cluster density to help officials prioritize systemic issues.',
    whatIsThis: 'Interactive GIS operations map.',
    whyIsUseful: 'Shows issue hotspots instantly.',
    howImproveAccountability: 'Prevents ignoring concentrated neighborhood failures.'
  },
  4: {
    targetId: 'transparency-dashboard-stats',
    title: '4. Public Transparency Dashboard',
    explanation: 'Displays real-time platform metrics, tracking total reports, AI verification status, and resolutions.',
    whyItMatters: 'Builds public trust by showing the pipeline status of every single submission.',
    whatIsThis: 'Platform-wide metric counter.',
    whyIsUseful: 'Provides high-level audit summary.',
    howImproveAccountability: 'Allows citizens to hold municipal departments accountable.'
  },
  5: {
    targetId: 'ai-civic-insights-card',
    title: '5. AI Civic Insights',
    explanation: 'Converts raw data into concise, actionable spatial intelligence using deterministic aggregation.',
    whyItMatters: 'Identifies major infrastructure failures across wards automatically.',
    whatIsThis: 'Evidence-based aggregation summaries.',
    whyIsUseful: 'Highlights key operational trends.',
    howImproveAccountability: 'Pinpoints specific wards needing urgent attention.'
  },
  6: {
    targetId: 'silence-ledger-container',
    title: '6. Cross-Issue Silence Ledger',
    explanation: 'Summarizes unresolved issues and tracks cumulative waiting time for notified authorities.',
    whyItMatters: 'Forces transparency on government delay by exposing exactly how long issues remain ignored.',
    whatIsThis: 'Delinquency and waiting time ledger.',
    whyIsUseful: 'Quantifies bureaucratic delays.',
    howImproveAccountability: 'Creates public pressure with evidence-based wait times.'
  },
  7: {
    targetId: 'ward-pattern-container',
    title: '7. Ward Pattern Intelligence',
    explanation: 'Visualizes pattern distributions across active wards to reveal systemic utility failures.',
    whyItMatters: 'Shows that issues are ward-wide infrastructure deficits, not isolated incidents.',
    whatIsThis: 'Evidence aggregation by ward.',
    whyIsUseful: 'Tracks ward-level failure patterns.',
    howImproveAccountability: 'Enables policy-level intervention instead of single fixes.'
  },
  8: {
    targetId: 'evidence-integrity-badge',
    title: '8. Evidence Integrity Badge',
    explanation: 'Uses perceptual hashing to verify if an uploaded image is unique or a visual duplicate.',
    whyItMatters: 'Shields the platform from spam while preserving genuine nearby submissions.',
    whatIsThis: 'Perceptual hashing verification.',
    whyIsUseful: 'Automatically flags duplicate spam.',
    howImproveAccountability: 'Guarantees only genuine evidence is escalated.'
  },
  9: {
    targetId: 'agent-timeline-container',
    title: '9. Agent Timeline',
    explanation: 'Tracks the backend reasoning steps of the 5-agent pipeline from intake to brief compilation.',
    whyItMatters: 'Provides absolute explainability on how AI analyzed and structured the case details.',
    whatIsThis: '5-agent reasoning history trail.',
    whyIsUseful: 'Reveals decision transparency.',
    howImproveAccountability: 'Ensures the AI reasoning path can be audited.'
  },
  10: {
    targetId: 'community-verification-container',
    title: '10. Community Verification',
    explanation: 'Allows nearby residents to corroborate reports, upload photos, and add comments.',
    whyItMatters: 'Leverages crowdsourced validation to strengthen and verify the report\'s urgency.',
    whatIsThis: 'Crowdsourced verification panel.',
    whyIsUseful: 'Builds community consensus.',
    howImproveAccountability: 'Mitigates fraud via citizen peer validation.'
  },
  11: {
    targetId: 'ai-recommendations-container',
    title: '11. AI Recommendations',
    explanation: 'Suggests target department, priority levels, and escalation timeline based on severity.',
    whyItMatters: 'Guides citizens on the most effective legal and administrative route for resolution.',
    whatIsThis: 'Strategic next-step advisor.',
    whyIsUseful: 'Identifies correct department routes.',
    howImproveAccountability: 'Standardizes escalations using regulatory windows.'
  },
  12: {
    targetId: 'complaint-draft-workspace',
    title: '12. Complaint Draft',
    explanation: 'An interactive workspace to edit and preview AI-generated complaints and RTI briefs.',
    whyItMatters: 'Keeps citizens in control, allowing them to refine facts before official submission.',
    whatIsThis: 'Editable document workspace.',
    whyIsUseful: 'Allows human review of AI drafts.',
    howImproveAccountability: 'Secures high-quality legal brief submissions.'
  },
  13: {
    targetId: 'government-response-tracker',
    title: '13. Government Response Tracker',
    explanation: 'Tracks post-submission statutory response windows (e.g. 30-day RTI reply cycle).',
    whyItMatters: 'Notifies citizens when response limits expire, prompting standard next actions.',
    whatIsThis: 'Statutory deadline tracker.',
    whyIsUseful: 'Flags unresponsive officials.',
    howImproveAccountability: 'Enforces statutory timelines on civic entities.'
  },
  14: {
    targetId: 'accountability-timeline-container',
    title: '14. Accountability Timeline',
    explanation: 'Models the complete lifecycle from evidence collection to final verification and closure.',
    whyItMatters: 'Tracks the exact progression steps of both citizens and officials.',
    whatIsThis: 'End-to-end lifecycle log.',
    whyIsUseful: 'Clarifies resolving milestones.',
    howImproveAccountability: 'Ensures visible, chronological tracking of case progress.'
  },
  15: {
    targetId: 'pdf-email-actions',
    title: '15. PDF + Email Actions',
    explanation: 'Enables official complaint submission via direct email or PDF export.',
    whyItMatters: 'Bridges online citizen verification with formal municipal grievance channels.',
    whatIsThis: 'Official dispatch control panel.',
    whyIsUseful: 'Sends legal briefs directly.',
    howImproveAccountability: 'Ensures complaints reach authorities with legal weight.'
  }
};

export const GuideTourOverlay: React.FC = () => {
  const {
    currentStep,
    isActive,
    showWelcome,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    dontShowAgain
  } = useTour();

  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);
  const scrollTimeout = useRef<any>(null);

  const step = stepsData[currentStep];

  useEffect(() => {
    if (!isActive || !step) {
      setHighlightStyle(null);
      return;
    }

    let active = true;
    let retries = 0;

    const updateHighlight = () => {
      if (!active) return;
      const element = document.getElementById(step.targetId);
      if (element) {
        // Smooth scroll to the element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Get bounding rect
        const rect = element.getBoundingClientRect();
        setHighlightStyle({
          top: `${rect.top + window.scrollY - 8}px`,
          left: `${rect.left + window.scrollX - 8}px`,
          width: `${rect.width + 16}px`,
          height: `${rect.height + 16}px`,
          position: 'absolute',
        });
      } else {
        // Element not found, wait briefly and retry (up to 2 times), then auto-skip to prevent freezing
        if (retries < 2) {
          retries++;
          setTimeout(updateHighlight, 150);
        } else {
          console.warn(`Tour step target #${step.targetId} not found, skipping step.`);
          nextStep();
        }
      }
    };

    // Delay a bit to let route changes render the page elements
    scrollTimeout.current = setTimeout(updateHighlight, 350);

    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);

    return () => {
      active = false;
      clearTimeout(scrollTimeout.current);
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [currentStep, isActive, step]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
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
  }, [isActive, currentStep]);

  const handleNext = () => {
    if (currentStep === 1) {
      // Auto pre-select first scenario if user clicks Next without choosing
      window.dispatchEvent(new CustomEvent('civicpulse-tour-select-default'));
    }
    nextStep();
  };

  if (showWelcome) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade font-sans max-h-screen overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-medium shadow-premium max-w-sm w-full p-6 text-center space-y-5 my-4">
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

  if (!isActive || !step) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[999] select-none font-sans">
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
          <p className="font-semibold text-slate-800">{step.explanation}</p>
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
            className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer border-none bg-transparent"
          >
            Skip
          </button>
          <div className="flex gap-2">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-255 bg-white text-slate-700 font-bold rounded hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
            >
              <ArrowLeft size={12} />
              <span>Back</span>
            </button>
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-sm cursor-pointer"
            >
              <span>{currentStep === 15 ? 'Finish' : 'Next'}</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideTourOverlay;
