import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Issue, Cluster, ImpactSummary, ActionDraft } from '@/api/types';

export type StepState = 'pending' | 'running' | 'completed' | 'failed';

export interface TimelineStepData {
  number: number;
  name: string;
  agentLabel: string;
  description: string;
  status: StepState;
}

interface AgentTimelineProps {
  // Post-upload issue data
  issue?: Issue;
  cluster?: Cluster | null;
  impactSummary?: ImpactSummary | null;
  actionDrafts?: ActionDraft[];

  // Upload/Submission state
  isSubmitting?: boolean;
  elapsedSeconds?: number;
  submitError?: string | null;

  // Custom steps override
  steps?: TimelineStepData[];
  className?: string;
  
  // Layout mode
  layout?: 'horizontal' | 'vertical' | 'responsive';
}

export const AgentTimelineComponent: React.FC<AgentTimelineProps> = ({
  issue,
  cluster,
  impactSummary,
  actionDrafts,
  isSubmitting,
  elapsedSeconds,
  submitError,
  steps,
  className,
  layout = 'responsive',
}) => {
  // Memoize derived states of the 5 stages to optimize rendering performance
  const computedSteps = useMemo(() => {
    if (steps) return steps;

    // Check if we are in upload/submitting state
    if (isSubmitting || submitError) {
      const isAgent1Done = (elapsedSeconds ?? 0) >= 7;

      const stage1Status: StepState = submitError && !isAgent1Done
        ? 'failed'
        : isAgent1Done
        ? 'completed'
        : 'running';

      const stage2Status: StepState = submitError && isAgent1Done
        ? 'failed'
        : isAgent1Done
        ? 'running'
        : 'pending';

      return [
        {
          number: 1,
          name: 'Image Verification',
          agentLabel: 'AI Classifier',
          description: 'Verifies visual parameters and severity.',
          status: stage1Status,
        },
        {
          number: 2,
          name: 'Nearby Incident Match',
          agentLabel: 'Community Matcher',
          description: 'Matches incident with reports in the same area.',
          status: stage2Status,
        },
        {
          number: 3,
          name: 'Impact Assessment',
          agentLabel: 'Impact Assessment',
          description: 'Calculates public safety consequences.',
          status: 'pending' as StepState,
        },
        {
          number: 4,
          name: 'Official Draft Preparation',
          agentLabel: 'Draft Preparer',
          description: 'Prepares complaints and official briefs.',
          status: 'pending' as StepState,
        },
        {
          number: 5,
          name: 'Escalation Dispatch',
          agentLabel: 'Action Dispatcher',
          description: 'Dispatches complaints via email or PDF.',
          status: 'pending' as StepState,
        },
      ];
    }

    const status = issue?.status;

    // 1. Image Verification: Completed if issue exists
    const stage1Status: StepState = issue ? 'completed' : 'pending';

    // 2. Nearby Incident Match:
    let stage2Status: StepState = 'pending';
    if (status === 'classified') {
      stage2Status = 'running';
    } else if (status === 'clustered' || status === 'drafted' || status === 'escalated') {
      stage2Status = 'completed';
    }

    // 3. Impact Assessment:
    let stage3Status: StepState = 'pending';
    if (impactSummary) {
      stage3Status = 'completed';
    } else if (status === 'clustered') {
      stage3Status = 'running';
    } else if (status === 'drafted' || status === 'escalated') {
      stage3Status = 'completed';
    }

    // 4. Official Draft Preparation:
    let stage4Status: StepState = 'pending';
    const hasDrafts = actionDrafts && actionDrafts.length > 0;
    if (hasDrafts || status === 'drafted' || status === 'escalated') {
      stage4Status = 'completed';
    } else if (stage3Status === 'completed') {
      stage4Status = 'running';
    }

    // 5. Escalation Dispatch:
    let stage5Status: StepState = 'pending';
    const activeEscalation = actionDrafts?.find((d) => d.escalation)?.escalation;
    const hasApprovedDraft = actionDrafts?.some((d) => d.status === 'approved');

    if (activeEscalation) {
      if (activeEscalation.status === 'failed') {
        stage5Status = 'failed';
      } else if (activeEscalation.status === 'sent' || activeEscalation.status === 'exported') {
        stage5Status = 'completed';
      } else {
        stage5Status = 'running';
      }
    } else if (status === 'escalated') {
      stage5Status = 'completed';
    } else if (hasApprovedDraft) {
      stage5Status = 'running';
    }

    return [
      {
        number: 1,
        name: 'Image Verification',
        agentLabel: 'AI Classifier',
        description: 'Verifies visual parameters and severity.',
        status: stage1Status,
      },
      {
        number: 2,
        name: 'Nearby Incident Match',
        agentLabel: 'Community Matcher',
        description: 'Matches incident with reports in the same area.',
        status: stage2Status,
      },
      {
        number: 3,
        name: 'Impact Assessment',
        agentLabel: 'Impact Assessment',
        description: 'Calculates public safety consequences.',
        status: stage3Status,
      },
      {
        number: 4,
        name: 'Official Draft Preparation',
        agentLabel: 'Draft Preparer',
        description: 'Prepares complaints and official briefs.',
        status: stage4Status,
      },
      {
        number: 5,
        name: 'Escalation Dispatch',
        agentLabel: 'Action Dispatcher',
        description: 'Dispatches complaints via email or PDF.',
        status: stage5Status,
      },
    ];
  }, [
    steps,
    issue,
    cluster,
    impactSummary,
    actionDrafts,
    isSubmitting,
    elapsedSeconds,
    submitError,
  ]);

  const isVertical = layout === 'vertical';
  const isHorizontal = layout === 'horizontal';
  const isResponsive = !isVertical && !isHorizontal;

  return (
    <div className={cn('w-full py-2', className)}>
      <ul
        role="list"
        className={cn(
          'flex select-none',
          isVertical ? 'flex-col gap-6' : isHorizontal ? 'flex-row gap-4' : 'flex-col md:flex-row md:gap-0 gap-8 w-full justify-between'
        )}
      >
        {computedSteps.map((step, stepIdx) => {
          const isLast = stepIdx === computedSteps.length - 1;

          return (
            <li
              key={step.number}
              tabIndex={0}
              aria-label={`Stage ${step.number}: ${step.name}. Status: ${step.status}`}
              className="relative flex-1 focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none rounded-medium p-1 transition-all"
            >
              {/* Connecting line - Mobile (Vertical) or Forced Vertical */}
              {!isLast && (isVertical || isResponsive) && (
                <span
                  className={cn(
                    'absolute left-[19px] top-[21px] w-[2px] h-[calc(100%+1.5rem)] -z-10 transition-colors duration-300',
                    isResponsive && 'md:hidden',
                    step.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200'
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Connecting line - Desktop (Horizontal) or Forced Horizontal */}
              {!isLast && (isHorizontal || isResponsive) && (
                <span
                  className={cn(
                    'absolute top-[21px] left-[50%] w-full h-[2px] -z-10 transition-colors duration-300',
                    isResponsive && 'hidden md:block',
                    step.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200'
                  )}
                  aria-hidden="true"
                />
              )}

              <div className={cn(
                'flex items-start gap-4 relative',
                isVertical ? 'flex-row text-left' : isHorizontal ? 'flex-col items-center text-center' : 'flex-row md:flex-col items-start md:items-center gap-4 md:gap-3 text-left md:text-center'
              )}>
                {/* Stage Indicator Circle */}
                <div className="shrink-0">
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 bg-white',
                      step.status === 'completed' && 'bg-emerald-50 border-emerald-500 text-emerald-700',
                      step.status === 'running' && 'bg-teal-50 border-teal-500 text-primary',
                      step.status === 'failed' && 'bg-rose-50 border-rose-500 text-rose-700',
                      step.status === 'pending' && 'bg-slate-50 border-slate-200 text-slate-400'
                    )}
                  >
                    {step.status === 'completed' && <CheckCircle2 size={18} className="shrink-0" />}
                    {step.status === 'failed' && <AlertCircle size={18} className="shrink-0" />}
                    {step.status === 'running' && (
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        className="w-3 h-3 rounded-full bg-primary shrink-0"
                      />
                    )}
                    {step.status === 'pending' && (
                      <span className="text-xs font-semibold">{step.number}</span>
                    )}
                  </span>
                </div>

                {/* Stage Descriptions */}
                <div className="space-y-0.5 pt-1 md:pt-0">
                  <h4 className={cn(
                    "text-xs font-bold font-sans tracking-tight leading-none",
                    step.status === 'pending' ? 'text-slate-400' : 'text-secondary-foreground'
                  )}>
                    {step.name}
                  </h4>
                  <span className={cn(
                    "inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded leading-none mt-0.5 select-none font-sans",
                    step.status === 'completed' && 'bg-emerald-50 text-emerald-800',
                    step.status === 'running' && 'bg-teal-50 text-teal-800',
                    step.status === 'failed' && 'bg-rose-50 text-rose-800',
                    step.status === 'pending' && 'bg-slate-100 text-slate-400'
                  )}>
                    {step.agentLabel}
                  </span>
                  <p className={cn(
                    "text-[10px] text-slate-450 leading-normal font-sans font-normal pt-1",
                    isResponsive ? 'hidden md:block' : 'block'
                  )}>
                    {step.description}
                  </p>
                  {isResponsive && (
                    <p className="block md:hidden text-[11px] text-slate-450 leading-normal font-sans font-normal">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export const AgentTimeline = React.memo(AgentTimelineComponent);
export default AgentTimeline;
