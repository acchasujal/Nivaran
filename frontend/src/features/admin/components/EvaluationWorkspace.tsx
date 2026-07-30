import React, { useState } from 'react';
import { Surface } from '../../../design-system/primitives/foundation/Surface';
import { Button } from '../../../design-system/primitives/buttons/Button';
import { Award, Play, CheckCircle2, RotateCcw, Bot, ShieldCheck, Landmark, CheckCircle, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FULL_E2E_SIMULATION_STEPS = [
  {
    id: 'step-1',
    role: 'Citizen',
    title: '1. Citizen Photo Evidence Capture & Intake',
    description: 'Citizen uploads clear photo evidence of severe footpath breakdown on NC Kelkar Rd, Dadar.',
    icon: Bot,
    statusBadge: 'INTAKE COMPLETE',
    details: 'Image uploaded (1.2 MB). EXIF GPS coordinates locked at 19.018° N, 72.830° E. Local IndexedDB draft initialized.',
    actionLabel: 'Trigger AI Perception & Triage',
  },
  {
    id: 'step-2',
    role: 'AI Neural Triage',
    title: '2. AI Vision Analysis & Severity Scoring',
    description: 'Gemini 1.5 Flash Vision model processes image tensor and classifies structural footpath hazard.',
    icon: ShieldCheck,
    statusBadge: 'AI SCORE: 94% CONFIDENCE',
    details: 'Visual neural model detected broken concrete slabs. Risk Score: 4/5 (High Severity). SLA set to 24-Hour Dispatch Target.',
    actionLabel: 'Run Spatial Duplicate Check',
  },
  {
    id: 'step-3',
    role: 'Deduplication Engine',
    title: '3. Spatial Deduplication & Cluster Grouping',
    description: 'Deduplication engine evaluates 200m spatial radius against active ward reports.',
    icon: Landmark,
    statusBadge: 'CLUSTER MATCH FOUND',
    details: 'Grouped with 3 existing citizen reports in Dadar Ward. Upvoted priority weight to High Risk Executive Priority.',
    actionLabel: 'Forward to Executive Queue',
  },
  {
    id: 'step-4',
    role: 'Executive Queue',
    title: '4. Executive Officer Review & SLA Clock Initialization',
    description: 'Departmental triage officer inspects case #iss-005 in Executive Work Queue.',
    icon: Landmark,
    statusBadge: 'DEPARTMENT ASSIGNED',
    details: 'Assigned to Public Works Directorate (PWD). Automated legal complaint directive & RTI brief generated.',
    actionLabel: 'Dispatch Auditor Sign-off',
  },
  {
    id: 'step-5',
    role: 'Public Auditor',
    title: '5. Auditor Sign-off & Contractor Dispatch',
    description: 'Public Auditor verifies legal complaint directive and triggers WhatsApp contractor dispatch.',
    icon: ShieldCheck,
    statusBadge: 'DIRECTIVE APPROVED',
    details: 'WhatsApp work order dispatched to PWD On-Call Repair Contractor. SLA Countdown: 18h remaining.',
    actionLabel: 'Simulate Contractor Resolution',
  },
  {
    id: 'step-6',
    role: 'Department & Contractor',
    title: '6. On-Site Physical Repair & After-Photo Upload',
    description: 'Contractor completes repair, uploads geotagged after-photo, and submits completion certificate.',
    icon: CheckCircle,
    statusBadge: 'WORK COMPLETED',
    details: 'Physical verification photo uploaded with matching cryptographic GPS stamp (NC Kelkar Rd).',
    actionLabel: 'Send Citizen Resolution Notification',
  },
  {
    id: 'step-7',
    role: 'Citizen Notification',
    title: '7. Consensus Audit Voting & Citizen Resolution Alert',
    description: 'Automated notification dispatched to original reporter and nearby ward citizens for verification vote.',
    icon: Bell,
    statusBadge: 'CASE CLOSED & VERIFIED',
    details: '14 nearby citizens submitted physical verification votes (93% consensus). Immutable audit log stored on ledger.',
    actionLabel: 'Restart Simulation',
  },
];

export const EvaluationWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const activeStep = FULL_E2E_SIMULATION_STEPS[currentStepIdx];

  const handleNext = () => {
    if (currentStepIdx < FULL_E2E_SIMULATION_STEPS.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      setCurrentStepIdx(0);
    }
  };

  const handleReset = () => {
    setCurrentStepIdx(0);
  };

  return (
    <div className="space-y-6 font-sans py-2">
      {/* Hackathon Evaluation Banner */}
      <Surface variant="card" className="p-6 space-y-4 border-l-4 border-l-amber-500 bg-white shadow-subtle">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-pill">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Hackathon Judge Evaluation Mode — Full E2E Journey</h2>
              <p className="text-xs text-neutral-700">Automated end-to-end simulation across all 7 stages of Nivaran governance architecture</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-pill">
              STEP {currentStepIdx + 1} OF 7
            </span>
            <Button variant="ghost" size="sm" onClick={handleReset} leadingIcon={<RotateCcw className="w-3.5 h-3.5" />}>
              Reset Flow
            </Button>
          </div>
        </div>

        {/* E2E Simulation Progress Tracker Bar */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {FULL_E2E_SIMULATION_STEPS.map((s, idx) => {
            const isDone = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStepIdx(idx)}
                className={`p-2 rounded text-left border text-[10px] font-bold transition-all ${
                  isCurrent
                    ? 'border-primary-500 bg-primary-50 text-primary-900 ring-2 ring-primary-500/20'
                    : isDone
                    ? 'border-green-300 bg-green-50 text-green-800'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-400'
                }`}
              >
                <div className="truncate">{idx + 1}. {s.role}</div>
              </button>
            );
          })}
        </div>
      </Surface>

      {/* Active Step Interactive Player Card */}
      <Surface variant="card" className="p-6 space-y-6 bg-white shadow-subtle border border-neutral-200">
        <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-pill">
                Role: {activeStep.role}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-pill">
                {activeStep.statusBadge}
              </span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900">{activeStep.title}</h3>
            <p className="text-xs text-neutral-600">{activeStep.description}</p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
            leadingIcon={currentStepIdx === FULL_E2E_SIMULATION_STEPS.length - 1 ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          >
            {activeStep.actionLabel}
          </Button>
        </div>

        {/* Live Simulation Details Surface */}
        <div className="p-4 rounded-lg bg-neutral-900 text-white font-mono text-xs space-y-2 border border-neutral-800">
          <div className="flex items-center justify-between text-teal-400 font-bold border-b border-neutral-800 pb-2">
            <span>[E2E SIMULATION RUNTIME ENGINES]</span>
            <span>STATUS: ACTIVE_VERIFIED</span>
          </div>
          <p className="text-neutral-300 leading-relaxed pt-1">
            {activeStep.details}
          </p>
        </div>

        {/* Interactive Workspace Deep-Link Shortcuts */}
        <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-neutral-500 font-medium">
            Jump to corresponding live application view:
          </span>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/report')}>
              Citizen Wizard
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/government/queue')}>
              Executive Queue
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/internal/document-review/iss-005')}>
              Officer & Auditor Workspace
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/tracker')}>
              Public GIS Map Tracker
            </Button>
          </div>
        </div>
      </Surface>

      {/* Complete Flow Stepper Timeline */}
      <Surface variant="card" className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2">
          End-to-End Governance Audit Trail Checklist
        </h3>

        <div className="space-y-3">
          {FULL_E2E_SIMULATION_STEPS.map((step, idx) => {
            const isDone = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div
                key={step.id}
                onClick={() => setCurrentStepIdx(idx)}
                className={`p-4 rounded-lg border transition-all flex items-start gap-3 cursor-pointer ${
                  isCurrent
                    ? 'border-primary-500 bg-primary-50/20 ring-2 ring-primary-500/20'
                    : isDone
                    ? 'border-green-200 bg-green-50/60 text-neutral-900'
                    : 'border-neutral-200 bg-neutral-50/50 text-neutral-500 opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-pill flex items-center justify-center text-xs font-bold shrink-0 ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-primary-700 text-white'
                      : 'bg-neutral-300 text-neutral-700'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>

                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-neutral-900">{step.title}</h4>
                    <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">{step.role}</span>
                  </div>
                  <p className="text-xs text-neutral-600">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Surface>
    </div>
  );
};

