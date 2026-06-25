import React from 'react';
import { FileText, CheckCircle2, Calendar, Mail, FileDown } from 'lucide-react';
import type { Escalation } from '@/api/types';
import { getStaticUrl } from '@/api/client';
import { StatusBadge } from '../shared/StatusBadge';
import { cn } from '@/lib/utils';

interface EscalationCardProps {
  escalation: Escalation;
  className?: string;
}

export const EscalationCard: React.FC<EscalationCardProps> = ({ escalation, className }) => {
  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Pending';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  const getMethodIcon = (m: string) => {
    if (m === 'email') return <Mail size={15} className="text-slate-400" />;
    return <FileText size={15} className="text-slate-400" />;
  };

  const hasPDF = !!escalation.pdf_download_url;

  return (
    <div className={cn('border border-secondary-border bg-white rounded-large p-6 shadow-subtle space-y-4 animate-slide', className)}>
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-secondary-border pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-emerald-50 text-emerald-700 shrink-0">
            <CheckCircle2 size={16} />
          </span>
          <span className="text-sm font-semibold text-slate-700 font-sans">Send Receipt</span>
        </div>
        
        {/* Status Badge */}
        <StatusBadge status={escalation.status} />
      </div>

      {/* Details columns */}
      <div className="space-y-3">
        {/* Dispatch Parameters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Method
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium font-sans">
              {getMethodIcon(escalation.method)}
              <span className="capitalize">{escalation.method === 'pdf_export' ? 'Saved PDF' : 'Sent Email'}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Timestamp
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-sans">
              <Calendar size={13} className="text-slate-300 shrink-0" />
              <span>{formatDate(escalation.sent_at || escalation.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Recipient */}
        {escalation.recipient && (
          <div className="space-y-0.5 pt-1 border-t border-slate-50">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Recipient Destination
            </span>
            <span className="text-xs font-semibold text-slate-800 font-sans break-all">
              {escalation.recipient}
            </span>
          </div>
        )}

        {/* Provider Response Log */}
        {escalation.provider_response && (
          <div className="space-y-1 pt-2 border-t border-slate-50">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Provider Log Output
            </span>
            <pre className="text-[10px] bg-slate-50 p-2.5 rounded border border-slate-100 text-slate-600 font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-24">
              {escalation.provider_response}
            </pre>
          </div>
        )}

        {/* Download PDF Control (fallback or direct) */}
        {hasPDF && (
          <div className="pt-3 border-t border-slate-100 flex flex-col shrink-0 select-none">
            <a
              href={getStaticUrl(escalation.pdf_download_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-small shadow transition-all active:scale-[0.99] focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:outline-none"
            >
              <FileDown size={14} />
              <span>Download PDF Package</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
export default EscalationCard;
