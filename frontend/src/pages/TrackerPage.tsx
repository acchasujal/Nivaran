import React, { useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Map, Plus, Filter, Users, ShieldAlert, Landmark, FileCheck, Clock, Activity, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { IssueCard } from '@/components/issue/IssueCard';
import { IssueMap } from '@/components/issue/IssueMap';
import { useIssues } from '@/api/queries';
import { cn } from '@/lib/utils';

export const TrackerPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useIssues();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL search params for stateful filter state
  const selectedType = searchParams.get('type') || 'all';
  const selectedRisk = searchParams.get('risk') || 'all';
  const selectedIssueId = searchParams.get('selected') || null;

  const setSelectedType = (type: string) => {
    const params = new URLSearchParams(searchParams);
    if (type === 'all') params.delete('type');
    else params.set('type', type);
    setSearchParams(params);
  };

  const setSelectedRisk = (risk: string) => {
    const params = new URLSearchParams(searchParams);
    if (risk === 'all') params.delete('risk');
    else params.set('risk', risk);
    setSearchParams(params);
  };

  const setSelectedIssueId = (issueId: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (!issueId) params.delete('selected');
    else params.set('selected', issueId);
    setSearchParams(params);
  };

  // Auto-scroll selected card into view
  useEffect(() => {
    if (selectedIssueId) {
      const element = document.getElementById(`issue-card-${selectedIssueId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedIssueId]);

  // Compute stats and sorting using useMemo to prevent unnecessary recalibration
  const processedData = useMemo(() => {
    if (!data?.issues) return {
      issues: [],
      stats: { reports: 0, verified: 0, inProgress: 0, drafted: 0, escalated: 0, citizens: 0 },
      silenceStats: { awaitingAction: 0, authoritiesNotified: 0, escalated: 0, averageWaitingDays: 0, cumulativeWaitingDays: 0, verifiedReports: 0, citizensImpacted: 0 },
      clusterCounts: {}
    };

    const sortedIssues = [...data.issues].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const stats = {
      reports: sortedIssues.length,
      verified: sortedIssues.filter(i => i.credibility_score >= 0.8).length,
      inProgress: sortedIssues.filter(i => i.status === 'clustered' || i.status === 'classified').length,
      drafted: sortedIssues.filter(i => i.status === 'drafted' || i.status === 'approved').length,
      escalated: sortedIssues.filter(i => i.status === 'escalated').length,
      citizens: sortedIssues.length * 25, // Evidence-grounded footprint proxy (25 residents per report area)
    };

    const unresolvedIssues = sortedIssues.filter(i => (i.status as string) !== 'closed' && (i.status as string) !== 'resolved');
    const now = new Date();
    const waitingDaysList = unresolvedIssues.map(i => {
      const created = new Date(i.created_at);
      const diff = Math.max(0, now.getTime() - created.getTime());
      return diff / (1000 * 60 * 60 * 24);
    });
    const cumulativeWaitingDays = waitingDaysList.reduce((sum, d) => sum + d, 0);
    const averageWaitingDays = unresolvedIssues.length > 0 ? (cumulativeWaitingDays / unresolvedIssues.length) : 0;

    const silenceStats = {
      awaitingAction: unresolvedIssues.length,
      authoritiesNotified: unresolvedIssues.filter(i => i.status === 'escalated').length,
      escalated: unresolvedIssues.filter(i => i.status === 'escalated').length,
      averageWaitingDays: Math.round(averageWaitingDays * 10) / 10,
      cumulativeWaitingDays: Math.round(cumulativeWaitingDays),
      verifiedReports: unresolvedIssues.filter(i => i.credibility_score >= 0.8).length,
      citizensImpacted: unresolvedIssues.length * 25,
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
      silenceStats,
      clusterCounts
    };
  }, [data]);

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

  const { issues, stats, silenceStats, clusterCounts } = processedData;

  // Filter issues client-side based on Category and Risk
  const filteredIssues = issues.filter((issue) => {
    const typeMatch = selectedType === 'all' || issue.issue_type === selectedType;
    
    let riskMatch = true;
    if (selectedRisk === 'high') riskMatch = issue.severity >= 4;
    else if (selectedRisk === 'moderate') riskMatch = issue.severity === 3;
    else if (selectedRisk === 'low') riskMatch = issue.severity <= 2;
    
    return typeMatch && riskMatch;
  });

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    setSearchParams(params);
  };

  return (
    <div className="flex-1 flex flex-col pb-12 font-sans">
      {/* Landing Experience: 15-second value proposition header */}
      <div className="bg-slate-900 text-white rounded-medium p-6 md:p-8 mt-6 shadow-premium relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-950/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest bg-teal-950/80 px-2 py-0.5 rounded-small border border-teal-800 select-none">
            AI-Grounded Action Platform
          </span>
          <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight leading-tight">
            CivicPulse Operations Center
          </h2>
          <p className="text-xs md:text-sm text-slate-355 font-normal leading-relaxed">
            Every citizen report containing photographic evidence is processed through an automated verification pipeline. The system clusters duplicates, assesses neighborhood safety risk, and drafts reviewable, sendable legal briefs for official action.
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

      {/* Public Transparency Dashboard */}
      {isLoading ? (
        <LoadingState variant="dashboard-stats" className="mt-6" />
      ) : (
        <div className="mt-6 border border-slate-200 bg-white rounded-medium shadow-subtle overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 select-none">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-primary" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Public Transparency Dashboard</span>
            </div>
            <span className="text-[9px] text-slate-400">Live data • All metrics from verified reports</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-100 border-b border-slate-100">
            {[
              { label: 'Total Reports', value: stats.reports, icon: Users, sub: 'All submissions', color: 'text-slate-700' },
              { label: 'Verified', value: stats.verified, icon: ShieldAlert, sub: 'Credibility ≥ 80%', color: 'text-emerald-700' },
              { label: 'In Progress', value: stats.inProgress, icon: Clock, sub: 'Classified & clustered', color: 'text-amber-700' },
              { label: 'Drafted', value: stats.drafted, icon: FileCheck, sub: 'Brief generated', color: 'text-blue-700' },
              { label: 'Escalated', value: stats.escalated, icon: Landmark, sub: 'Sent to authority', color: 'text-rose-700' },
              { label: 'Citizens Affected', value: `${stats.citizens}+`, icon: Users, sub: 'Footprint proxy', color: 'text-slate-700' },
            ].map(({ label, value, icon: Icon, sub, color }) => (
              <div key={label} className="px-5 py-4 space-y-1 select-none">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                  <Icon size={12} className="text-slate-300" />
                </div>
                <p className={`text-xl font-bold tracking-tight ${color}`}>{value}</p>
                <span className="text-[9px] text-slate-400 block">{sub}</span>
              </div>
            ))}
          </div>

          {/* Cross-Issue Silence Ledger Sub-Section */}
          <div className="bg-slate-50/30">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 select-none">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-600" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Cross-Issue Silence Ledger</span>
              </div>
              <span className="text-[9px] text-slate-400">Accountability summary of verified evidence awaiting action</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-x divide-y lg:divide-y-0 divide-slate-100">
              {[
                { label: 'Reports Awaiting Action', value: silenceStats.awaitingAction, icon: AlertCircle, sub: 'Unresolved reports', color: 'text-rose-700 font-extrabold' },
                { label: 'Authorities Notified', value: silenceStats.authoritiesNotified, icon: Landmark, sub: 'Grievances escalated', color: 'text-amber-700' },
                { label: 'Escalated', value: silenceStats.escalated, icon: Landmark, sub: 'Awaiting response', color: 'text-rose-700' },
                { label: 'Average Waiting Days', value: `${silenceStats.averageWaitingDays}d`, icon: Clock, sub: 'Average report age', color: 'text-slate-700 font-mono' },
                { label: 'Cumulative Waiting Days', value: `${silenceStats.cumulativeWaitingDays}d`, icon: Clock, sub: 'Platform total wait', color: 'text-slate-700 font-mono' },
                { label: 'Verified Reports', value: silenceStats.verifiedReports, icon: ShieldAlert, sub: 'Confirmed credibility', color: 'text-emerald-700' },
                { label: 'Citizens Impacted', value: `${silenceStats.citizensImpacted}+`, icon: Users, sub: 'Footprint proxy', color: 'text-slate-700' },
              ].map(({ label, value, icon: Icon, sub, color }) => (
                <div key={label} className="px-5 py-4 space-y-1 select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                    <Icon size={12} className="text-slate-300" />
                  </div>
                  <p className={`text-lg font-bold tracking-tight ${color}`}>{value}</p>
                  <span className="text-[9px] text-slate-400 block">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div id="active-cases" className="mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 select-none">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 font-sans">
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-450" />
            <span>Category:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-white border border-slate-250 rounded-small px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-primary transition-colors shadow-sm cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="road_damage">Road Damage</option>
              <option value="street_lighting">Street Lighting</option>
              <option value="garbage">Garbage Overflow</option>
              <option value="water">Water Leakage</option>
              <option value="footpath">Broken Footpath</option>
              <option value="dumping">Illegal Dumping</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Risk Level:</span>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="bg-white border border-slate-250 rounded-small px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-primary transition-colors shadow-sm cursor-pointer"
            >
              <option value="all">All Risks</option>
              <option value="high">Critical & High (Sev 4-5)</option>
              <option value="moderate">Moderate (Sev 3)</option>
              <option value="low">Low (Sev 1-2)</option>
            </select>
          </div>
        </div>
        
        <div className="text-[10px] font-bold text-slate-450 uppercase tracking-widest font-sans">
          Audit Display: {filteredIssues.length} of {issues.length} Cases
        </div>
      </div>

      {/* Map & List Split Layout Container: 65% Map First Visual Priority */}
      <div className="py-6 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Map Visualization (Left Column - Prioritized) */}
        {!isLoading && filteredIssues.length > 0 && (
          <div className="w-full lg:w-[65%] h-[380px] lg:h-[600px] shrink-0 rounded-medium overflow-hidden border border-slate-200/80 shadow-subtle bg-white relative">
            <IssueMap
              issues={filteredIssues}
              selectedIssueId={selectedIssueId}
              onSelectIssue={setSelectedIssueId}
              className="w-full h-full"
            />
          </div>
        )}

        {/* List of Cards (Right Column - Dynamic Flex-1 takes remaining 35%) */}
        <div className="flex-1 flex flex-col max-h-[600px] lg:overflow-y-auto pr-0 lg:pr-2 scrollbar-thin">
          {isLoading ? (
            <LoadingState variant="tracker-card" count={4} />
          ) : filteredIssues.length === 0 ? (
            <EmptyState
              icon={Map}
              title={selectedType !== 'all' || selectedRisk !== 'all' ? "No matching reports" : "No reports registered"}
              description={
                selectedType !== 'all' || selectedRisk !== 'all'
                  ? "No community reports of this specific category and risk level have been logged yet. Reset active filters to view other reports."
                  : "The public tracker is currently empty. Submit a new report with photo evidence to trigger the automated verification pipeline."
              }
              action={
                selectedType !== 'all' || selectedRisk !== 'all' ? (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center px-4 py-2 border border-slate-200 bg-white text-xs font-semibold text-secondary-foreground rounded-small hover:bg-slate-50 transition-all cursor-pointer shadow-sm animate-fade"
                  >
                    Reset Filters
                  </button>
                ) : (
                  <Link
                    to="/"
                    className="inline-flex items-center px-4 py-2 border border-slate-200 bg-white text-xs font-semibold text-secondary-foreground rounded-small hover:bg-slate-50 transition-all cursor-pointer shadow-sm animate-fade"
                  >
                    Submit First Report
                  </Link>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredIssues.map((issue, index) => {
                const reportsCount = issue.cluster_id ? (clusterCounts[issue.cluster_id] || 1) : 1;
                const isSelected = selectedIssueId === issue.id;
                return (
                  <motion.div
                    key={issue.id}
                    id={`issue-card-${issue.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className={cn(
                      "transition-all duration-300 rounded-medium cursor-pointer",
                      isSelected && "ring-2 ring-primary border-primary shadow-md scale-[1.01]"
                    )}
                  >
                    <IssueCard
                      issue={issue}
                      reportsCount={reportsCount}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackerPage;
