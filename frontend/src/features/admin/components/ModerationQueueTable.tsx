import React from 'react';
import { useAdminStore } from '../state/useAdminStore';
import { Surface } from '../../../design-system/primitives/foundation/Surface';
import { StatusChip } from '../../../design-system/composites/status/StatusChip';
import { Button } from '../../../design-system/primitives/buttons/Button';
import { EmptyState } from '../../../design-system/primitives/feedback/EmptyState';
import { ShieldAlert, CheckCircle2, XCircle, Archive } from 'lucide-react';

export const ModerationQueueTable: React.FC = () => {
  const { moderationQueue, updateModerationStatus } = useAdminStore();
  const pendingItems = moderationQueue.filter((m) => m.status === 'pending');

  return (
    <div className="space-y-4 font-sans py-2">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 text-amber-900 rounded-pill">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Platform Moderation & Content Review Queue</h3>
            <p className="text-xs text-neutral-700">Flagged evidence photos, duplicate appeals, and automated safety reviews</p>
          </div>
        </div>

        <span className="text-xs font-mono font-semibold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-pill">
          {pendingItems.length} Pending Moderation Items
        </span>
      </div>

      {pendingItems.length === 0 ? (
        <EmptyState title="Moderation queue clear" description="All flagged reports and evidence uploads have been reviewed by moderators." />
      ) : (
        <div className="space-y-3">
          {pendingItems.map((item) => (
            <Surface key={item.id} variant="card" elevation={1} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-sm">
                    {item.id}
                  </span>
                  <StatusChip category="government" label={item.reportType.replace('_', ' ').toUpperCase()} size="sm" />
                  <span className="text-xs font-mono text-neutral-700">• {item.timestamp}</span>
                </div>

                <h4 className="text-sm font-semibold text-neutral-900">Case ID: {item.caseId}</h4>
                <p className="text-xs text-neutral-700 leading-relaxed">{item.description}</p>
                <p className="text-[11px] font-mono text-neutral-700">Flagged by: {item.flaggedBy}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateModerationStatus(item.id, 'rejected')}
                  leadingIcon={<XCircle className="w-3.5 h-3.5 text-danger" />}
                >
                  Reject Content
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateModerationStatus(item.id, 'archived')}
                  leadingIcon={<Archive className="w-3.5 h-3.5" />}
                >
                  Archive
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => updateModerationStatus(item.id, 'approved')}
                  leadingIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Approve Evidence
                </Button>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
};
