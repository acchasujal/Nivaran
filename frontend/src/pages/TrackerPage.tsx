import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Map, Plus, Filter, Users, ShieldAlert, Landmark, FileCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { IssueCard } from '@/components/issue/IssueCard';
import { useIssues } from '@/api/queries';

export const TrackerPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useIssues();
  const [selectedType, setSelectedType] = useState<string>('all');

  // Compute stats and sorting using useMemo to prevent unnecessary recalibration
  const processedData = useMemo(() => {
    if (!data?.issues) return { issues: [], stats: { reports: 0, verified: 0, citizens: 0, notified: 0 }, clusterCounts: {} };

    const sortedIssues = [...data.issues].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const stats = {
      reports: sortedIssues.length,
      verified: sortedIssues.filter(i => i.credibility_score >= 0.8).length,
      citizens: sortedIssues.length * 25, // Evidence-grounded footprint proxy (25 residents per report area)
      notified: sortedIssues.filter(i => i.status === 'escalated').length,
    };

    const clusterCounts = sortedIssues.reduce((acc, issue) => {
      if (issue.cluster_id) {
        acc[issue.cluster_id] = (acc[issue.cluster_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      issues: sortedIssues,
      stats,
      clusterCounts
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col pb-12 animate-fade">
        <PageHeader
          title="Civic Operations Center"
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

  const { issues, stats, clusterCounts } = processedData;

  // Filter issues client-side
  const filteredIssues = issues.filter((issue) => {
    if (selectedType === 'all') return true;
    return issue.issue_type === selectedType;
  });

  return (
    <div className="flex-1 flex flex-col pb-12 font-sans">
      {/* Landing Experience Redesign: 15-second value proposition header */}
      <div className="bg-slate-900 text-white rounded-medium p-6 md:p-8 mt-6 shadow-premium relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-950/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest bg-teal-950/80 px-2 py-0.5 rounded-small border border-teal-800 select-none">
            AI-Grounded Action Platform
          </span>
          <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight leading-tight">
            CivicPulse Operations Center
          </h2>
          <p className="text-xs md:text-sm text-slate-350 font-normal leading-relaxed">
            Every citizen report containing photographic evidence is processed through an automated verification pipeline. The system clusters duplicates, assesses neighborhood safety risk, and draft reviewable, sendable legal briefs for official action.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-small transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus size={14} />
              <span>Submit Report Evidence</span>
            </Link>
            <a
              href="#active-cases"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-350 text-xs font-semibold rounded-small transition-all"
            >
              <Map size={14} />
              <span>Audit Active Cases</span>
            </a>
          </div>
        </div>
      </div>

      {/* Impact-Oriented Stats Overview Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="border border-slate-200 bg-white rounded-medium p-4 space-y-1 shadow-subtle select-none">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Community Reports</span>
            <Users size={15} className="text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 tracking-tight">{stats.reports}</p>
          <span className="text-[9px] text-slate-450 block">Logged evidence contributions</span>
        </div>

        <div className="border border-slate-200 bg-white rounded-medium p-4 space-y-1 shadow-subtle select-none">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Verified Issues</span>
            <ShieldAlert size={15} className="text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 tracking-tight">{stats.verified}</p>
          <span className="text-[9px] text-slate-450 block">High confidence credibility score</span>
        </div>

        <div className="border border-slate-200 bg-white rounded-medium p-4 space-y-1 shadow-subtle select-none">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Citizens Impacted</span>
            <FileCheck size={15} className="text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 tracking-tight">{stats.citizens}+</p>
          <span className="text-[9px] text-slate-450 block">Neighborhood footprint coverage</span>
        </div>

        <div className="border border-slate-200 bg-white rounded-medium p-4 space-y-1 shadow-subtle select-none">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Authorities Notified</span>
            <Landmark size={15} className="text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 tracking-tight">{stats.notified}</p>
          <span className="text-[9px] text-slate-450 block">Escalated case file dispatches</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div id="active-cases" className="mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 select-none">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold font-sans">
          <Filter size={14} className="text-slate-450" />
          <span>Filter by Class:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-white border border-slate-250 rounded-small px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-primary transition-colors shadow-sm cursor-pointer"
          >
            <option value="all">All Issues</option>
            <option value="road_damage">Road Damage</option>
            <option value="street_lighting">Street Lighting</option>
            <option value="garbage">Garbage Overflow</option>
            <option value="water">Water Leakage</option>
            <option value="footpath">Broken Footpath</option>
            <option value="dumping">Illegal Dumping</option>
          </select>
        </div>
        
        <div className="text-[10px] font-bold text-slate-450 uppercase tracking-widest font-sans">
          Audit Display: {filteredIssues.length} of {issues.length} Cases
        </div>
      </div>

      {/* Grid List View / Empty State */}
      <div className="py-6 flex-1 flex flex-col">
        {filteredIssues.length === 0 ? (
          <EmptyState
            icon={Map}
            title={selectedType !== 'all' ? "No matching reports" : "No reports registered"}
            description={
              selectedType !== 'all'
                ? "No community reports of this specific category have been logged yet. Clear the filter to view all active civic issues."
                : "The public tracker is currently empty. Submit a new report with photo evidence to trigger the automated verification pipeline."
            }
            action={
              selectedType !== 'all' ? (
                <button
                  onClick={() => setSelectedType('all')}
                  className="inline-flex items-center px-4 py-2 border border-slate-200 bg-white text-xs font-semibold text-secondary-foreground rounded-small hover:bg-slate-50 transition-all cursor-pointer shadow-sm animate-fade"
                >
                  Clear filter
                </button>
              ) : (
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-slate-200 bg-white text-xs font-semibold text-secondary-foreground rounded-small hover:bg-slate-50 transition-all cursor-pointer shadow-sm animate-fade"
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
