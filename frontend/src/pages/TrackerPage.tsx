import React, { useMemo, useEffect, useState } from 'react';
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
import { getLocalityAndWard } from '@/utils/getLocalityName';
import { humanizeIssueType } from '@/utils/issueHelpers';

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
  const [selectedWard, setSelectedWard] = useState<string | null>(null);

  // Compute Ward Pattern Intelligence dynamically from live data
  const wardStats = useMemo(() => {
    const wards: Record<string, {
      wardName: string;
      totalReports: number;
      clusterIds: Set<string>;
      issueTypes: Record<string, number>;
      verifiedCount: number;
      escalatedCount: number;
    }> = {};

    issues.forEach((issue) => {
      const { ward } = getLocalityAndWard(issue.latitude, issue.longitude);
      if (ward === 'Unknown Ward') return;

      if (!wards[ward]) {
        wards[ward] = {
          wardName: ward,
          totalReports: 0,
          clusterIds: new Set<string>(),
          issueTypes: {},
          verifiedCount: 0,
          escalatedCount: 0,
        };
      }

      const w = wards[ward];
      w.totalReports += 1;
      if (issue.cluster_id) {
        w.clusterIds.add(issue.cluster_id);
      }
      w.issueTypes[issue.issue_type] = (w.issueTypes[issue.issue_type] || 0) + 1;
      if (issue.credibility_score >= 0.8) {
        w.verifiedCount += 1;
      }
      if (issue.status === 'escalated') {
        w.escalatedCount += 1;
      }
    });

    return Object.values(wards).map((w) => {
      let highestCount = 0;
      let highestRiskCategory = 'N/A';
      Object.entries(w.issueTypes).forEach(([type, count]) => {
        if (count > highestCount) {
          highestCount = count;
          highestRiskCategory = type;
        }
      });

      return {
        wardName: w.wardName,
        totalReports: w.totalReports,
        clusterCount: w.clusterIds.size,
        issueTypes: w.issueTypes,
        highestRiskCategory,
        verifiedCount: w.verifiedCount,
        escalatedCount: w.escalatedCount,
      };
    });
  }, [issues]);

  // Filter issues client-side based on Category, Risk, and Ward
  const filteredIssues = issues.filter((issue) => {
    const typeMatch = selectedType === 'all' || issue.issue_type === selectedType;
    
    let riskMatch = true;
    if (selectedRisk === 'high') riskMatch = issue.severity >= 4;
    else if (selectedRisk === 'moderate') riskMatch = issue.severity === 3;
    else if (selectedRisk === 'low') riskMatch = issue.severity <= 2;

    let wardMatch = true;
    if (selectedWard) {
      const { ward } = getLocalityAndWard(issue.latitude, issue.longitude);
      wardMatch = ward === selectedWard;
    }
    
    return typeMatch && riskMatch && wardMatch;
  });

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    setSearchParams(params);
    setSelectedWard(null);
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

          {/* Ward Pattern Intelligence Sub-Section */}
          <div className="border-t border-slate-100 bg-slate-50/10">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 select-none">
              <div className="flex items-center gap-2">
                <Map size={14} className="text-teal-600" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Ward Pattern Intelligence</span>
              </div>
              <span className="text-[9px] text-slate-400">Click a ward card below to filter the operations map & reports list</span>
            </div>
            
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {wardStats.map((w) => {
                const isSelected = selectedWard === w.wardName;
                return (
                  <div
                    key={w.wardName}
                    onClick={() => setSelectedWard(isSelected ? null : w.wardName)}
                    className={cn(
                      "transition-all border rounded-medium p-4 cursor-pointer select-none space-y-3",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-350 hover:shadow-subtle"
                    )}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-800">{w.wardName}</span>
                      {isSelected ? (
                        <span className="text-[8px] font-bold bg-primary text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Active Filter</span>
                      ) : (
                        <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">Select Ward</span>
                      )}
                    </div>

                    {/* Issue Type Distribution List */}
                    <div className="space-y-1.5 min-h-[85px] flex flex-col justify-center">
                      {Object.entries(w.issueTypes).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center text-[10px] text-slate-500 font-sans">
                          <span>{humanizeIssueType(type, '')}</span>
                          <div className="flex-1 border-b border-dotted border-slate-200 mx-2" />
                          <span className="font-bold text-slate-700">{count}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 pt-2.5 flex flex-col gap-1 text-[9px] text-slate-450 leading-relaxed">
                      <div className="flex justify-between">
                        <span>Total Reports:</span>
                        <strong className="text-slate-700 font-bold">{w.totalReports}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Clusters:</span>
                        <strong className="text-slate-700 font-bold">{w.clusterCount}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Highest Risk:</span>
                        <strong className="text-slate-700 font-bold text-rose-700">{humanizeIssueType(w.highestRiskCategory, '')}</strong>
                      </div>
                      <div className="flex justify-between border-t border-slate-100/50 pt-1 mt-1">
                        <span>Verified / Escalated:</span>
                        <strong className="text-slate-700 font-bold">
                          {w.verifiedCount} / {w.escalatedCount}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
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

          {selectedWard && (
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-2.5 py-1.5 rounded-small text-xs font-bold font-sans">
              <span>Ward: {selectedWard}</span>
              <button
                type="button"
                onClick={() => setSelectedWard(null)}
                className="hover:bg-primary/25 rounded p-0.5 ml-1 transition-colors text-primary/80 hover:text-primary cursor-pointer border-none bg-transparent flex items-center justify-center font-bold text-[9px] leading-none"
              >
                ✕
              </button>
            </div>
          )}
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
