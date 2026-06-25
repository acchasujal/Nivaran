import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Map, Plus, AlertCircle, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { IssueCard } from '@/components/issue/IssueCard';
import { useIssues } from '@/api/queries';

export const TrackerPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useIssues();
  const [selectedType, setSelectedType] = useState<string>('all');

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col pb-12 animate-fade">
        <PageHeader
          title="Public Tracker"
          subtitle="Monitor active civic issues, track pipeline progress, and review community dispatches."
        />
        <div className="py-8">
          <LoadingState variant="card" count={3} message="Retrieving community reports..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col pb-12 py-8">
        <ErrorState
          title="Failed to Load Tracker"
          explanation={error instanceof Error ? error.message : 'Could not query the reports list from the server.'}
          onRetry={refetch}
          retryText="Retry Loading"
        />
      </div>
    );
  }

  const issues = data?.issues || [];

  // Group reports by cluster_id client-side to compute collective evidence matching counts
  const clusterCounts = issues.reduce((acc, issue) => {
    if (issue.cluster_id) {
      acc[issue.cluster_id] = (acc[issue.cluster_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Filter issues client-side by selected type
  const filteredIssues = issues.filter((issue) => {
    if (selectedType === 'all') return true;
    return issue.issue_type === selectedType;
  });

  return (
    <div className="flex-1 flex flex-col pb-12">
      {/* Page Header */}
      <PageHeader
        title="Public Tracker"
        subtitle="Monitor active civic issues, track pipeline progress, and review community dispatches."
        action={
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-small shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus size={16} />
            <span>New Report</span>
          </Link>
        }
      />

      {/* Prominent Self-Reported Warning Banner */}
      <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-slate-50 border border-secondary-border rounded-medium select-none text-xs text-slate-600 leading-normal animate-fade">
        <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block mb-0.5">
            Public Disclosure Notice
          </span>
          <p className="font-normal font-sans text-slate-500">
            All data on this tracker is <strong>community self-reported</strong> and verified in real-time through the CivicPulse AI Pipeline. Always verify complaint briefs locally before manual escalation.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      {issues.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 select-none">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold font-sans">
            <Filter size={14} className="text-slate-450" />
            <span>Filter by Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-white border border-secondary-border rounded-small px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-slate-350 transition-colors shadow-sm cursor-pointer"
            >
              <option value="all">All Issues</option>
              <option value="road_damage">Road Damage</option>
              <option value="lighting">Street Lighting</option>
              <option value="water">Water Supply / Leakage</option>
              <option value="waste">Waste / Garbage</option>
              <option value="other">Other Civic Issue</option>
            </select>
          </div>
          
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">
            Showing {filteredIssues.length} of {issues.length} Reports
          </div>
        </div>
      )}

      {/* Grid List View / Empty State */}
      <div className="py-6 flex-1 flex flex-col">
        {filteredIssues.length === 0 ? (
          <EmptyState
            icon={Map}
            title={selectedType !== 'all' ? "No reports match filter" : "No reports yet"}
            description={
              selectedType !== 'all'
                ? "No community self-reported evidence matches the selected issue type filter. Try selecting 'All Issues'."
                : "All community self-reported evidence will appear here. Submit a new report with photographic evidence to trigger the verification and escalation pipeline."
            }
            action={
              selectedType !== 'all' ? (
                <button
                  onClick={() => setSelectedType('all')}
                  className="inline-flex items-center px-4 py-2 border border-secondary-border bg-white text-xs font-semibold text-secondary-foreground rounded-small hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                >
                  Clear filter
                </button>
              ) : (
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-secondary-border bg-white text-xs font-semibold text-secondary-foreground rounded-small hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                >
                  Start Intake Flow
                </Link>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade">
            {filteredIssues.map((issue) => {
              // reportsCount is issues with the same cluster_id, or 1 if unclustered
              const reportsCount = issue.cluster_id ? (clusterCounts[issue.cluster_id] || 1) : 1;
              return (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  reportsCount={reportsCount}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackerPage;
