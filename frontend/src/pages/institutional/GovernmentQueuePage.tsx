import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../core/hooks/usePageTitle';
import { useIssues } from '../../api/queries';
import { useGovernmentQueueStore } from '../../features/government/state/useGovernmentQueueStore';
import { QueueFilterControls } from '../../features/government/components/QueueFilterControls';
import { WorkQueueTable } from '../../features/government/components/WorkQueueTable';
import { WorkQueueKanban } from '../../features/government/components/WorkQueueKanban';
import { SLAAnalyticsDashboard } from '../../features/government/components/SLAAnalyticsDashboard';
import { LoadingIndicator } from '../../design-system/primitives/feedback/LoadingIndicator';
import { ErrorState } from '../../design-system/primitives/feedback/ErrorState';
import { Button } from '../../design-system/primitives/buttons/Button';
import { LayoutGrid, Table } from 'lucide-react';

export const GovernmentQueuePage: React.FC = () => {
  usePageTitle('Executive Work Queue — Municipal Operations');
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useIssues();
  const { filters, selectedIds, updateFilters, toggleSelect, selectAll, clearSelection } = useGovernmentQueueStore();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingIndicator label="Loading executive work queue..." size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load executive queue"
        description="Could not connect to Nivaran municipal backend services."
        onRetry={() => refetch()}
      />
    );
  }

  const allIssues = data?.issues || [];

  // Filter issues
  const filteredIssues = allIssues.filter((issue) => {
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchId = issue.id.toLowerCase().includes(q);
      const matchDesc = (issue.description || '').toLowerCase().includes(q);
      if (!matchId && !matchDesc) return false;
    }

    if (filters.highRiskOnly && issue.severity < 4) return false;
    if (filters.status !== 'all' && issue.status !== filters.status) return false;

    return true;
  });

  return (
    <div className="space-y-6 font-sans py-2">
      <SLAAnalyticsDashboard />

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-neutral-900">Assigned Department Work Queue</h2>
            <span className="text-xs font-mono font-semibold text-primary-700 bg-primary-500/10 px-2 py-0.5 rounded-pill">
              {filteredIssues.length} Queue Items
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              leadingIcon={<LayoutGrid className="w-3.5 h-3.5" />}
            >
              Kanban Board
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              leadingIcon={<Table className="w-3.5 h-3.5" />}
            >
              Queue Table
            </Button>
          </div>
        </div>

        <QueueFilterControls filters={filters} onUpdate={updateFilters} />

        {viewMode === 'kanban' ? (
          <WorkQueueKanban
            issues={filteredIssues}
            onReviewCase={(issueId) => navigate(`/internal/document-review/${issueId}`)}
          />
        ) : (
          <WorkQueueTable
            issues={filteredIssues}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            onReviewCase={(issueId) => navigate(`/internal/document-review/${issueId}`)}
          />
        )}
      </div>
    </div>
  );
};

export default GovernmentQueuePage;
