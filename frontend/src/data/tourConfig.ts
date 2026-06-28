// ─── Tour Step Schema ──────────────────────────────────────────────────────────
//
// The guide is a PASSIVE observer. It never navigates, never clicks, never
// submits. Each step explains a feature and waits for the user to act.
//
// validation() returns true when the expected user action is complete.
// If validation never passes within ~30s, "Skip this step" appears.
//
// expectedAction: Human-readable instruction shown in the card.
// route:          Informational — used to tell user where to go.

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
  // Legacy fields kept for backward compat — may be empty string
  whatIsThis?: string;
  whyIsUseful?: string;
  howImproveAccountability?: string;
  footerNote?: string;
}

// ─── Jump Menu Groups ─────────────────────────────────────────────────────────
//
// Used by the Feature Explorer jump menu in the overlay.

export interface TourGroup {
  label: string;
  stepIds: string[];
}

export const tourGroups: TourGroup[] = [
  { label: 'Submission', stepIds: ['scenario', 'upload', 'ai-pipeline'] },
  { label: 'Intelligence', stepIds: ['tracker', 'dashboard', 'ai-insights', 'silence-ledger', 'ward-pattern'] },
  { label: 'Maps', stepIds: ['maps'] },
  { label: 'Case File', stepIds: ['evidence-integrity', 'community-verification', 'timeline', 'complaint-draft', 'ai-recommendations', 'government-tracker'] },
  { label: 'Actions', stepIds: ['save-pdf', 'send-email'] },
];

// ─── Steps ────────────────────────────────────────────────────────────────────

export const tourSteps: TourStep[] = [
  // ── 1. Submission ────────────────────────────────────────────────────────
  {
    id: 'scenario',
    route: '/',
    targetId: 'demo-scenario',
    selector: '#demo-scenario-select',
    title: '1. Choose a Demo Scenario',
    description: 'Pick any preset scenario to load realistic civic evidence instantly.',
    whyItMatters: 'Loads a complete evidence package in one click — no photo sourcing needed.',
    expectedAction: 'Select any scenario from the dropdown above.',
    validation: () => {
      // Passes when a photo preview is visible (scenario loaded)
      return !!document.querySelector('img[alt="Evidence preview"]') ||
        !!document.querySelector('[data-photo-loaded]') ||
        // Also valid if photo-uploader shows a preview image
        !!document.querySelector('#photo-uploader-container img');
    },
  },
  {
    id: 'upload',
    route: '/',
    targetId: 'photo-uploader',
    selector: '#photo-uploader-container',
    title: '2. Upload Evidence',
    description: 'Photo evidence drives the entire AI pipeline. Any infrastructure photo works.',
    whyItMatters: 'The AI cannot classify or draft without verified visual proof.',
    expectedAction: 'A demo scenario photo should already be loaded. Proceed to the next step.',
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
    title: '3. AI Processing Pipeline',
    description: 'Submit the report to run Agent 1 (Classification) and Agent 2 (Deduplication).',
    whyItMatters: 'Every output traces to this step — no human classification, no fabricated scores.',
    expectedAction: 'Click "Submit to Operations Center" to submit the report.',
    validation: () => {
      // Passes when the user navigates to an issue detail page after submission
      return window.location.pathname.startsWith('/issue/') &&
        !window.location.pathname.includes(':id');
    },
  },

  // ── 2. Platform Intelligence ─────────────────────────────────────────────
  {
    id: 'tracker',
    route: '/tracker',
    targetId: 'tracker-header',
    selector: '.bg-slate-900',
    title: '4. Operations Center',
    description: 'The public dashboard aggregates all citizen-submitted evidence.',
    whyItMatters: 'Creates a transparent public ledger of unresolved municipal failures.',
    expectedAction: 'Click "Tracker" in the sidebar to open the Operations Center.',
    validation: () => window.location.pathname === '/tracker',
  },
  {
    id: 'dashboard',
    route: '/tracker',
    targetId: 'transparency-dashboard',
    selector: '#transparency-dashboard-stats',
    title: '5. Transparency Dashboard',
    description: 'Live platform metrics — reports, verified count, escalations. All from real data.',
    whyItMatters: 'Every metric is evidence-grounded and survives judge cross-examination.',
    expectedAction: 'Review the dashboard stats panel on the Tracker page.',
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
    title: '6. AI Civic Insights',
    description: 'Deterministic spatial intelligence derived from actual submitted reports.',
    whyItMatters: 'Identifies infrastructure failure patterns without fabricating any scores.',
    expectedAction: 'Scroll down to see the AI Civic Insights card.',
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
    title: '7. Silence Ledger',
    description: 'Tracks cumulative waiting days for unresolved issues — forcing transparency on delay.',
    whyItMatters: 'Exposes exactly how long government has ignored each reported problem.',
    expectedAction: 'Scroll to the Cross-Issue Silence Ledger section.',
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
    title: '8. Ward Pattern Intelligence',
    description: 'Shows issue distribution by ward — systemic failures, not isolated incidents.',
    whyItMatters: 'Enables policy-level intervention by revealing concentrated infrastructure deficits.',
    expectedAction: 'Scroll to the Ward Pattern Intelligence section. Click any ward to filter.',
    validation: () => {
      const el = document.querySelector('#ward-pattern-container');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    },
  },

  // ── 3. Maps ──────────────────────────────────────────────────────────────
  {
    id: 'maps',
    route: '/tracker',
    targetId: 'operations-map',
    selector: '#operations-map-container',
    title: '9. Google Maps GIS Engine',
    description: 'Geolocated reports with dynamic clustering and risk-coded markers.',
    whyItMatters: 'Cluster density helps officials prioritize systemic hotspots over isolated fixes.',
    expectedAction: 'Scroll to the map on the Tracker page.',
    validation: () => {
      const el = document.querySelector('#operations-map-container');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const gmStyle = el.querySelector('.gm-style');
      return rect.width > 100 && rect.height > 100 && !!gmStyle;
    },
  },

  // ── 4. Case File ─────────────────────────────────────────────────────────
  {
    id: 'evidence-integrity',
    route: '/issue/:id',
    targetId: 'evidence-integrity',
    selector: '#evidence-integrity-badge',
    title: '10. Evidence Integrity Badge',
    description: 'Perceptual hashing flags visual duplicates automatically.',
    whyItMatters: 'Prevents spam while keeping genuine nearby reports — no manual review needed.',
    expectedAction: 'Click any report in the Tracker to open its Case File.',
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
    title: '11. Community Verification',
    description: 'Residents can corroborate reports with photos and comments.',
    whyItMatters: 'Crowdsourced validation builds consensus and strengthens escalation credibility.',
    expectedAction: 'Scroll to the Community Corroboration section in the Case File.',
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
    title: '12. Agent Processing Timeline',
    description: '5-agent reasoning trail from intake to brief compilation.',
    whyItMatters: 'Complete auditability — every AI decision is visible and traceable.',
    expectedAction: 'Review the AI Agent Processing Pipeline in Section 02.',
    validation: () => {
      const el = document.querySelector('#agent-timeline-container');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    },
  },
  {
    id: 'complaint-draft',
    route: '/issue/:id',
    targetId: 'complaint-draft',
    selector: '#complaint-draft-workspace',
    title: '13. Complaint Draft Workspace',
    description: 'AI-generated complaint and RTI briefs — editable before submission.',
    whyItMatters: 'Citizens stay in control. AI drafts, humans authorize. No bypassing the gate.',
    expectedAction: 'Scroll to Section 05: Accountability Action Drafts.',
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
    title: '14. AI Recommendations',
    description: 'Suggests target department, priority level, and escalation timeline.',
    whyItMatters: 'Routes complaints to the correct authority using regulatory frameworks.',
    expectedAction: 'Review the AI Recommendations panel at the top of the Case File.',
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
    title: '15. Government Response Tracker',
    description: 'Tracks statutory response windows (e.g. 30-day RTI cycle).',
    whyItMatters: 'Alerts citizens when response deadlines expire — creating legal accountability.',
    expectedAction: 'Scroll to the accountability timeline section.',
    validation: () => {
      const el = document.querySelector('#government-response-tracker') ||
        document.querySelector('#accountability-timeline-container');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    },
  },

  // ── 5. Actions ──────────────────────────────────────────────────────────
  {
    id: 'save-pdf',
    route: '/issue/:id',
    targetId: 'btn-save-pdf',
    selector: '#tour-btn-save-pdf',
    title: '16. PDF Export',
    description: 'Compiles the complaint brief into an official PDF for print or filing.',
    whyItMatters: 'Bridges digital evidence with a tangible, portable document for officials.',
    expectedAction: 'Click "Generate PDF" inside the Complaint Draft Workspace.',
    validation: () => {
      // Passes when any draft has been escalated via pdf_export
      // or when the EscalationDialog is open for pdf_export
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
    title: '17. Email Dispatch',
    description: 'Sends the complaint package to the ward officer via SendGrid HTTP API.',
    whyItMatters: 'A real external action — demonstrably connects AI output to official channels.',
    expectedAction: 'Click "Send Email" inside the Complaint Draft Workspace.',
    validation: () => {
      // Passes when the EscalationDialog is open (email method)
      const dialog = document.querySelector('[data-escalation-dialog]');
      const emailActive = document.querySelector('[data-method="email"]');
      return !!dialog || !!emailActive;
    },
  },
];
