// ─── Tour Step Schema ──────────────────────────────────────────────────────────

export interface TourStep {
  id: string;
  route: string;
  targetId: string;
  selector?: string;
  title: string;
  description: string;
  whyItMatters: string;
  expectedAction: string;
  validation?: () => boolean;
  // Legacy fields kept for backward compat
  whatIsThis?: string;
  whyIsUseful?: string;
  howImproveAccountability?: string;
  footerNote?: string;
}

// ─── Evaluation Phases ─────────────────────────────────────────────────────────

export interface TourPhase {
  number: number;
  name: string;
}

export const getStepPhase = (stepId: string): TourPhase => {
  switch (stepId) {
    case 'scenario':
    case 'upload':
      return { number: 1, name: 'Submit Report' };
    case 'ai-pipeline':
    case 'evidence-integrity':
    case 'timeline':
      return { number: 2, name: 'AI Verification' };
    case 'tracker':
    case 'dashboard':
    case 'ai-insights':
    case 'silence-ledger':
    case 'ward-pattern':
    case 'maps':
      return { number: 3, name: 'Platform Intelligence' };
    case 'community-verification':
    case 'complaint-draft':
    case 'ai-recommendations':
    case 'government-tracker':
      return { number: 4, name: 'Complaint Workspace' };
    case 'save-pdf':
    case 'send-email':
      return { number: 5, name: 'Dispatch & Accountability' };
    default:
      return { number: 1, name: 'Submit Report' };
  }
};

export const tourPhases: TourPhase[] = [
  { number: 1, name: 'Submit Report' },
  { number: 2, name: 'AI Verification' },
  { number: 3, name: 'Platform Intelligence' },
  { number: 4, name: 'Complaint Workspace' },
  { number: 5, name: 'Dispatch & Accountability' },
];

// ─── Feature Explorer Items (Evaluation Tasks) ─────────────────────────────────

export interface FeatureExplorerItem {
  id: string;
  label: string;
  stepId: string;
}

export const explorerFeatures: FeatureExplorerItem[] = [
  { id: 'submit_report',         label: 'Submit Report',             stepId: 'scenario' },
  { id: 'ai_verification',       label: 'Review AI Verification',     stepId: 'ai-pipeline' },
  { id: 'operations_center',     label: 'Explore Operations Center',  stepId: 'tracker' },
  { id: 'ai_insights',           label: 'Inspect AI Civic Insights',  stepId: 'ai-insights' },
  { id: 'silence_ledger',        label: 'Review Silence Ledger',      stepId: 'silence-ledger' },
  { id: 'ward_intelligence',     label: 'Explore Ward Intelligence',  stepId: 'ward-pattern' },
  { id: 'complaint_workspace',   label: 'Review Complaint Workspace', stepId: 'complaint-draft' },
  { id: 'pdf_export',            label: 'Generate Complaint PDF',     stepId: 'save-pdf' },
  { id: 'email_dispatch',        label: 'Send Complaint Email',       stepId: 'send-email' },
];

// ─── Steps (all descriptions <=20 words for maximum brevity) ──────────────────

export const tourSteps: TourStep[] = [
  // ── Phase 1: Submit Report ───────────────────────────────────────────────
  {
    id: 'scenario',
    route: '/',
    targetId: 'demo-scenario',
    selector: '#demo-scenario-select',
    title: 'Choose a Demo Scenario',
    description: 'Select a preset scenario to load realistic civic evidence instantly.',
    whyItMatters: 'Loads a complete evidence package in one click.',
    expectedAction: 'Select any scenario from the dropdown.',
    validation: () => {
      return !!document.querySelector('img[alt="Evidence preview"]') ||
        !!document.querySelector('[data-photo-loaded]') ||
        !!document.querySelector('#photo-uploader-container img');
    },
  },
  {
    id: 'upload',
    route: '/',
    targetId: 'photo-uploader',
    selector: '#photo-uploader-container',
    title: 'Upload Evidence Photo',
    description: 'Photo evidence triggers the automated AI processing pipeline.',
    whyItMatters: 'Visual proof is required to ensure accountability.',
    expectedAction: 'A demo photo is already loaded. Proceed.',
    validation: () => {
      return !!document.querySelector('img[alt="Evidence preview"]') ||
        !!document.querySelector('#photo-uploader-container img');
    },
  },
  {
    id: 'ai-pipeline',
    route: '/',
    targetId: 'ai-pipeline',
    selector: '#intake-pipeline-container',
    title: 'AI Processing Pipeline',
    description: 'Submitting triggers image analysis and deduplication checks.',
    whyItMatters: 'No manual work — AI classifies and processes reports.',
    expectedAction: 'Click "Submit to Operations Center".',
    validation: () => {
      return window.location.pathname.startsWith('/issue/') &&
        !window.location.pathname.includes(':id');
    },
  },

  // ── Phase 3: Platform Intelligence ──────────────────────────────────────
  {
    id: 'tracker',
    route: '/tracker',
    targetId: 'tracker-header',
    selector: '.bg-slate-900',
    title: 'Operations Center',
    description: 'Public portal aggregating all verified community reports.',
    whyItMatters: 'Creates a transparent public ledger of municipal issues.',
    expectedAction: 'Click "Tracker" in the sidebar.',
    validation: () => window.location.pathname === '/tracker',
  },
  {
    id: 'dashboard',
    route: '/tracker',
    targetId: 'transparency-dashboard',
    selector: '#transparency-dashboard-stats',
    title: 'Transparency Dashboard',
    description: 'Live verified stats and metrics computed directly from data.',
    whyItMatters: 'Provides auditable metrics for evaluation.',
    expectedAction: 'Review the stats on the Tracker page.',
    validation: () => {
      return window.location.pathname === '/tracker' &&
        !!document.querySelector('#transparency-dashboard-stats');
    },
  },
  {
    id: 'ai-insights',
    route: '/tracker',
    targetId: 'ai-insights',
    selector: '#ai-civic-insights-card',
    title: 'AI Civic Insights',
    description: 'Finds city-wide issue patterns using spatial data.',
    whyItMatters: 'Identifies systemic infrastructure failures across wards.',
    expectedAction: 'Scroll to the AI Civic Insights card.',
    validation: () => {
      const el = document.querySelector('#ai-civic-insights-card');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    },
  },
  {
    id: 'silence-ledger',
    route: '/tracker',
    targetId: 'silence-ledger',
    selector: '#silence-ledger-container',
    title: 'Silence Ledger',
    description: 'Shows unresolved complaint delays and response times.',
    whyItMatters: 'Exposes how long government has ignored community issues.',
    expectedAction: 'Scroll to the Silence Ledger section.',
    validation: () => {
      const el = document.querySelector('#silence-ledger-container');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    },
  },
  {
    id: 'ward-pattern',
    route: '/tracker',
    targetId: 'ward-pattern',
    selector: '#ward-pattern-container',
    title: 'Ward Pattern Intelligence',
    description: 'Maps spatial distribution of failure patterns by ward.',
    whyItMatters: 'Pinpoints priority zones for municipal resource allocation.',
    expectedAction: 'Scroll to the Ward Pattern section.',
    validation: () => {
      const el = document.querySelector('#ward-pattern-container');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    },
  },

  // ── Maps ─────────────────────────────────────────────────────────────────
  {
    id: 'maps',
    route: '/tracker',
    targetId: 'operations-map',
    selector: '#operations-map-container',
    title: 'City-wide GIS Map',
    description: 'Geolocated reports with dynamic clustering and risk markers.',
    whyItMatters: 'Visualizes issue hotspots and municipal risk zones.',
    expectedAction: 'Scroll to the map on the Tracker page.',
    validation: () => {
      const el = document.querySelector('#operations-map-container');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const gmStyle = el.querySelector('.gm-style');
      return rect.width > 100 && rect.height > 100 && !!gmStyle;
    },
  },

  // ── Phase 2: AI Verification (Case File) ─────────────────────────────────
  {
    id: 'evidence-integrity',
    route: '/issue/:id',
    targetId: 'evidence-integrity',
    selector: '#evidence-integrity-badge',
    title: 'Duplicate Detection',
    description: 'Detects duplicate evidence using perceptual image hashing.',
    whyItMatters: 'Prevents spam submissions while preserving genuine reports.',
    expectedAction: 'Click any report to open its Case File.',
    validation: () => {
      return window.location.pathname.startsWith('/issue/') &&
        !window.location.pathname.includes(':id');
    },
  },
  {
    id: 'community-verification',
    route: '/issue/:id',
    targetId: 'community-verification',
    selector: '#community-verification-container',
    title: 'Community Verification',
    description: 'Allows citizens to verify, comment, and upload photos.',
    whyItMatters: 'Consensus-driven verification builds case credibility.',
    expectedAction: 'Scroll to the Community Verification section.',
    validation: () => {
      const el = document.querySelector('#community-verification-container');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    },
  },
  {
    id: 'timeline',
    route: '/issue/:id',
    targetId: 'agent-timeline',
    selector: '#agent-timeline-container',
    title: 'AI Decision Timeline',
    description: 'Reasoning trail of all five AI agents.',
    whyItMatters: 'Ensures absolute transparency and auditability for decisions.',
    expectedAction: 'Review the AI Decision Timeline in Section 02.',
    validation: () => {
      const el = document.querySelector('#agent-timeline-container');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    },
  },

  // ── Phase 4: Complaint Workspace ─────────────────────────────────────────
  {
    id: 'complaint-draft',
    route: '/issue/:id',
    targetId: 'complaint-draft',
    selector: '#complaint-draft-workspace',
    title: 'Complaint Draft Workspace',
    description: 'Creates official complaint drafts editable before escalation.',
    whyItMatters: 'Citizens control and authorize AI-generated documents.',
    expectedAction: 'Scroll to Section 05: Action Drafts.',
    validation: () => {
      const el = document.querySelector('#complaint-draft-workspace');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    },
  },
  {
    id: 'ai-recommendations',
    route: '/issue/:id',
    targetId: 'ai-recommendations',
    selector: '#ai-recommendations-container',
    title: 'AI Recommendations',
    description: 'Identifies target departments and suggests escalation priorities.',
    whyItMatters: 'Ensures files route to the correct authority.',
    expectedAction: 'Review the Recommendations panel in the Case File.',
    validation: () => {
      return window.location.pathname.startsWith('/issue/') &&
        !window.location.pathname.includes(':id') &&
        !!document.querySelector('#ai-recommendations-container');
    },
  },
  {
    id: 'government-tracker',
    route: '/issue/:id',
    targetId: 'government-tracker',
    selector: '#government-response-tracker',
    title: 'Government Response Tracker',
    description: 'Tracks statutory response timelines and compliance windows.',
    whyItMatters: 'Alerts citizens when legal deadlines are breached.',
    expectedAction: 'Scroll to the accountability timeline.',
    validation: () => {
      const el = document.querySelector('#government-response-tracker') ||
        document.querySelector('#accountability-timeline-container');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    },
  },

  // ── Phase 5: Dispatch & Accountability ───────────────────────────────────
  {
    id: 'save-pdf',
    route: '/issue/:id',
    targetId: 'btn-save-pdf',
    selector: '#tour-btn-save-pdf',
    title: 'Generate Complaint PDF',
    description: 'Compiles the evidence and drafts into a printable PDF.',
    whyItMatters: 'Creates a portable file for physical filing.',
    expectedAction: 'Click "Generate PDF" in the draft workspace.',
    validation: () => {
      const dialog = document.querySelector('[data-escalation-dialog]');
      const pdfActive = document.querySelector('[data-method="pdf_export"]');
      return !!dialog || !!pdfActive ||
        !!document.querySelector('.escalation-dialog-open[data-method="pdf_export"]');
    },
  },
  {
    id: 'send-email',
    route: '/issue/:id',
    targetId: 'btn-send-email',
    selector: '#tour-btn-send-email',
    title: 'Send Complaint Email',
    description: 'Dispatches the complaint package directly to authorities.',
    whyItMatters: 'External action connects platform outputs to officials.',
    expectedAction: 'Click "Send Email" in the workspace.',
    validation: () => {
      const dialog = document.querySelector('[data-escalation-dialog]');
      const emailActive = document.querySelector('[data-method="email"]');
      return !!dialog || !!emailActive;
    },
  },
];
