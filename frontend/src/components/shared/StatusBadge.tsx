import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeStatusType = 
  | 'classified' | 'clustered' | 'drafted' | 'approved' | 'escalated' // Issue states
  | 'pending_review' | 'rejected' // Draft states
  | 'sent' | 'exported' | 'failed' // Escalation states
  | 'awaiting_response' | 'high_priority' | 'rti_recommended' | 'verified' | 'completed'; // Lifecycle states

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatusType | string;
}

interface BadgeConfig {
  label: string;
  className: string;
}

const statusConfigs: Record<string, BadgeConfig> = {
  // Issue statuses
  classified: {
    label: 'Intake Analysis',
    className: 'bg-slate-50 text-slate-600 border-slate-200',
  },
  clustered: {
    label: 'Nearby Reports Matched',
    className: 'bg-slate-50 text-slate-600 border-slate-200',
  },
  drafted: {
    label: 'Complaint Prepared',
    className: 'bg-slate-50 text-slate-600 border-slate-200',
  },
  approved: {
    label: 'Complaint Approved',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-250',
  },
  escalated: {
    label: 'Escalated',
    className: 'bg-emerald-100/70 text-emerald-800 border-emerald-200',
  },

  // Draft statuses
  pending_review: {
    label: 'Awaiting Approval',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },

  // Escalation statuses
  sent: {
    label: 'Email Dispatched',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-250',
  },
  exported: {
    label: 'PDF Exported',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  failed: {
    label: 'Send Failed',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },

  // Lifecycle & semantic badges
  awaiting_response: {
    label: 'Awaiting Response',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  high_priority: {
    label: 'High Priority',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  rti_recommended: {
    label: 'RTI Recommended',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  verified: {
    label: 'Verified',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  completed: {
    label: 'Completed',
    className: 'bg-teal-50 text-teal-700 border-teal-200',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, ...props }) => {
  const normalizedStatus = status.toLowerCase();
  const config = statusConfigs[normalizedStatus] || {
    label: status,
    className: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-small text-xs font-semibold border transition-colors select-none font-sans',
        config.className,
        className
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 shrink-0" />
      {config.label}
    </span>
  );
};
export default StatusBadge;
