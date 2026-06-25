import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeStatusType = 
  | 'classified' | 'clustered' | 'drafted' | 'approved' | 'escalated' // Issue states
  | 'pending_review' | 'rejected' // Draft states
  | 'sent' | 'exported' | 'failed'; // Escalation states

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
    label: 'Classified',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  clustered: {
    label: 'Evidence Clustered',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  drafted: {
    label: 'Drafts Ready',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  escalated: {
    label: 'Escalated',
    className: 'bg-teal-50 text-teal-700 border-teal-200',
  },

  // Draft statuses
  pending_review: {
    label: 'Pending Review',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },

  // Escalation statuses
  sent: {
    label: 'Sent Successfully',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  exported: {
    label: 'Exported PDF',
    className: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  failed: {
    label: 'Escalation Failed',
    className: 'bg-red-50 text-red-700 border-red-200',
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
