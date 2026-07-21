import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../core/hooks/usePageTitle';
import { useIssues } from '../../api/queries';
import { useGovernmentQueueStore } from '../../features/government/state/useGovernmentQueueStore';
import { QueueFilterControls } from '../../features/government/components/QueueFilterControls';
import { WorkQueueTable } from '../../features/government/components/WorkQueueTable';
import { SLAAnalyticsDashboard } from '../../features/government/components/SLAAnalyticsDashboard';
import { LoadingIndicator } from '../../design-system/primitives/feedback/LoadingIndicator';
import { ErrorState } from '../../design-system/primitives/feedback/ErrorState';

export const GovernmentQueuePage: React.FC = () => {
  usePageTitle('Executive Work Queue — Municipal Operations');
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useIssues();
  const { filters, selectedIds, updateFilters, toggleSelect, selectAll, clearSelection } = useGovernmentQueueStore();

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
        description="Could not connect to CivicPulse municipal backend services."
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
          <h2 className="text-xl font-bold text-neutral-900">Assigned Department Work Queue</h2>
          <span className="text-xs font-mono font-semibold text-primary-700 bg-primary-500/10 px-2 py-0.5 rounded-pill">
            {filteredIssues.length} Queue Items
          </span>
        </div>

        <QueueFilterControls filters={filters} onUpdate={updateFilters} />

        <WorkQueueTable
          issues={filteredIssues}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          onReviewCase={() => navigate('/internal/document-review')}
        />
      </div>
    </div>
  );
};

export default GovernmentQueuePage;
