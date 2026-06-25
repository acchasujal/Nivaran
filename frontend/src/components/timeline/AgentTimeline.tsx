import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Circle, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepState = 'pending' | 'running' | 'completed' | 'failed';

export interface TimelineStepData {
  number: number;
  name: string;
  agentLabel: string;
  description: string;
  status: StepState;
  timestamp?: string | null;
}

interface AgentTimelineProps {
  steps?: TimelineStepData[];
  issueStatus?: 'classified' | 'clustered' | 'drafted' | 'escalated' | 'pending' | string;
  hasImpactSummary?: boolean;
  hasDrafts?: boolean;
  escalationStatus?: 'sent' | 'exported' | 'failed' | null;
  className?: string;
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({
  steps,
  issueStatus,
  hasImpactSummary,
  hasDrafts,
  escalationStatus,
  className,
}) => {
  // If steps are not provided, compute them automatically based on status flags
  const computedSteps: TimelineStepData[] = steps || [
    {
      number: 1,
      name: 'Agent 1: Issue Understanding',
      agentLabel: 'Gemini Vision Intake',
      description: 'Analyze image clarity, categorize issue, and assess severity.',
      status: (() => {
        if (!issueStatus || issueStatus === 'pending') return 'running';
        return 'completed';
      })(),
    },
    {
      number: 2,
      name: 'Agent 2: Proximity Verification',
      agentLabel: 'Deduplication & Clustering',
      description: 'Check proximity to existing reports and cluster semantic matches.',
      status: (() => {
        if (!issueStatus || issueStatus === 'pending') return 'pending';
        if (issueStatus === 'classified') return 'running';
        return 'completed';
      })(),
    },
    {
      number: 3,
      name: 'Agent 3: Impact Intelligence',
      agentLabel: 'Aggregated Impact Analysis',
      description: 'Evaluate collective risk and outline potential consequences.',
      status: (() => {
        if (!issueStatus || issueStatus === 'pending' || issueStatus === 'classified') return 'pending';
        if (hasImpactSummary || issueStatus === 'drafted' || issueStatus === 'escalated') return 'completed';
        return 'running';
      })(),
    },
    {
      number: 4,
      name: 'Agent 4: Action Draft Generator',
      agentLabel: 'Complaint, RTI & Summary Builder',
      description: 'Construct formal accountability complaints, RTI filings, and community briefs.',
      status: (() => {
        if (!hasImpactSummary && issueStatus !== 'drafted' && issueStatus !== 'escalated') return 'pending';
        if (hasDrafts || issueStatus === 'drafted' || issueStatus === 'escalated') return 'completed';
        return 'running';
      })(),
    },
    {
      number: 5,
      name: 'Agent 5: Accountability Escalator',
      agentLabel: 'SendGrid Email & PDF Export',
      description: 'Perform real external action: dispatch verified briefs to authorities or compile PDFs.',
      status: (() => {
        if (!hasDrafts && issueStatus !== 'drafted' && issueStatus !== 'escalated') return 'pending';
        if (issueStatus === 'escalated') {
          if (escalationStatus === 'failed') return 'failed';
          return 'completed';
        }
        if (escalationStatus === 'sent' || escalationStatus === 'exported') return 'completed';
        if (escalationStatus === 'failed') return 'failed';
        // If a draft is approved, and we have clicked escalate
        return 'pending';
      })(),
    },
  ];

  const getStepIcon = (status: StepState): { icon: LucideIcon; className: string } => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, className: 'text-emerald-500 bg-emerald-50' };
      case 'running':
        return { icon: Loader2, className: 'text-primary bg-blue-50 animate-spin' };
      case 'failed':
        return { icon: AlertCircle, className: 'text-rose-500 bg-rose-50' };
      default:
        return { icon: Circle, className: 'text-slate-300 bg-slate-50' };
    }
  };

  return (
    <div className={cn('flow-root w-full py-2', className)}>
      <ul role="list" className="-mb-8">
        {computedSteps.map((step, stepIdx) => {
          const { icon: Icon, className: iconClass } = getStepIcon(step.status);
          const isLast = stepIdx === computedSteps.length - 1;

          return (
            <li key={step.number}>
              <div className="relative pb-8">
                {/* Vertical connecting line */}
                {!isLast && (
                  <span
                    className={cn(
                      'absolute left-5 top-5 -ml-px h-full w-0.5 bg-slate-200',
                      step.status === 'completed' && 'bg-emerald-500'
                    )}
                    aria-hidden="true"
                  />
                )}
                
                <div className="relative flex items-start space-x-3">
                  {/* Step status icon wrapper */}
                  <div className="shrink-0">
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border border-secondary-border transition-colors duration-200',
                        iconClass
                      )}
                    >
                      {step.status === 'pending' ? (
                        <span className="text-xs font-semibold text-slate-400">{step.number}</span>
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </span>
                  </div>

                  {/* Step content block */}
                  <div className="min-w-0 flex-1 pt-1.5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-secondary-foreground font-sans">
                          {step.name}
                        </h3>
                        <span className="inline-block text-[11px] font-medium text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 mt-0.5">
                          {step.agentLabel}
                        </span>
                      </div>
                      
                      {step.timestamp && (
                        <span className="text-xs text-slate-400 shrink-0 select-none">
                          {step.timestamp}
                        </span>
                      )}
                    </div>
                    
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed font-normal">
                      {step.description}
                    </p>

                    {/* Subtle micro-animation when running */}
                    {step.status === 'running' && (
                      <motion.div
                        className="mt-2 h-1.5 w-32 bg-blue-100 rounded-full overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          animate={{
                            x: [-100, 150],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.5,
                            ease: 'easeInOut',
                          }}
                          style={{ width: '40%' }}
                        />
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
export default AgentTimeline;
