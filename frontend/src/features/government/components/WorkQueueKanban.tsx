import React from 'react';
import { Surface } from '../../../design-system/primitives/foundation/Surface';
import { Button } from '../../../design-system/primitives/buttons/Button';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import type { Issue } from '../../../api/types';

export interface WorkQueueKanbanProps {
  issues: Issue[];
  onReviewCase: (id: string) => void;
  className?: string;
}

const KANBAN_COLUMNS = [
  { id: 'classified', title: 'AI Classified / Intake', color: 'border-blue-500 bg-blue-50/50 text-blue-900' },
  { id: 'clustered', title: 'Clustered & Prioritized', color: 'border-amber-500 bg-amber-50/50 text-amber-900' },
  { id: 'approved', title: 'Executive Approved', color: 'border-emerald-500 bg-emerald-50/50 text-emerald-900' },
  { id: 'escalated', title: 'Escalated / In Progress', color: 'border-purple-500 bg-purple-50/50 text-purple-900' },
];

export const WorkQueueKanban: React.FC<WorkQueueKanbanProps> = ({
  issues,
  onReviewCase,
  className,
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-sans ${className || ''}`}>
      {KANBAN_COLUMNS.map((col) => {
        const columnIssues = issues.filter((i) => {
          const status = i.status as string;
          if (col.id === 'classified') return status === 'classified' || status === 'drafted';
          if (col.id === 'clustered') return status === 'clustered';
          if (col.id === 'approved') return status === 'approved';
          if (col.id === 'escalated') return status === 'escalated' || status === 'pending_review';
          return false;
        });

        return (
          <div key={col.id} className="space-y-3 bg-neutral-50/70 p-3 rounded-lg border border-neutral-200 min-h-[420px] flex flex-col">
            <div className={`p-2.5 rounded-md border font-bold text-xs flex items-center justify-between ${col.color}`}>
              <span>{col.title}</span>
              <span className="bg-white/80 text-neutral-800 font-mono px-2 py-0.5 rounded-pill text-[10px]">
                {columnIssues.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
              {columnIssues.length === 0 ? (
                <div className="h-32 border border-dashed border-neutral-200 rounded-md flex items-center justify-center text-xs text-neutral-400">
                  No active cases
                </div>
              ) : (
                columnIssues.map((issue) => (
                  <Surface
                    key={issue.id}
                    variant="card"
                    className="p-3.5 space-y-2.5 bg-white border border-neutral-200 shadow-subtle hover:border-primary-400 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-neutral-800">{issue.id}</span>
                      {issue.severity >= 4 && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                          <AlertTriangle className="w-2.5 h-2.5" /> High Risk
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-neutral-900 line-clamp-2 leading-tight">
                      {issue.description || `${issue.issue_type.replace('_', ' ').toUpperCase()} Incident`}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-1 border-t border-neutral-100">
                      <span className="flex items-center gap-1 text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                        <Clock className="w-2.5 h-2.5" /> 18h SLA
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReviewCase(issue.id)}
                        className="text-[10px] px-2 py-1 h-auto"
                        trailingIcon={<ArrowRight className="w-2.5 h-2.5" />}
                      >
                        Review
                      </Button>
                    </div>
                  </Surface>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WorkQueueKanban;
