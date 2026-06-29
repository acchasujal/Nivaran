import React, { useMemo, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Map, Plus, Filter, ShieldAlert, Landmark, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { IssueCard } from '@/components/issue/IssueCard';
import { IssueMap } from '@/components/issue/IssueMap';
import { useIssues, useValidationMetrics } from '@/api/queries';
import { cn } from '@/lib/utils';
import { getLocalityAndWard } from '@/utils/getLocalityName';
import { humanizeIssueType } from '@/utils/issueHelpers';
import { HelpTooltip } from '@/components/shared/HelpTooltip';
import { useTour } from '@/context/TourContext';

export const TrackerPage: React.FC = () => {
  const { registerTourTarget } = useTour();
  const { data, isLoading, error, refetch } = useIssues();
  const { data: metricsData } = useValidationMetrics();
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
      stats: { reports: 0, verified: 0, inProgress: 0, drafted: 0, escalated: 0 },
      silenceStats: { awaitingAction: 0, authoritiesNotified: 0, escalated: 0, averageWaitingDays: 0, cumulativeWaitingDays: 0, verifiedReports: 0, activeWards: 0 },
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

    const activeWardsSet = new Set(unresolvedIssues.map(i => {
      const { ward } = getLocalityAndWard(i.latitude, i.longitude);
      return ward;
    }).filter(w => w !== 'Unknown Ward'));

    const silenceStats = {
      awaitingAction: unresolvedIssues.length,
      authoritiesNotified: unresolvedIssues.filter(i => i.status === 'escalated').length,
      escalated: unresolvedIssues.filter(i => i.status === 'escalated').length,
      averageWaitingDays: Math.round(averageWaitingDays * 10) / 10,
      cumulativeWaitingDays: Math.round(cumulativeWaitingDays),
      verifiedReports: unresolvedIssues.filter(i => i.credibility_score >= 0.8).length,
      activeWards: activeWardsSet.size,
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

  // Compute AI Civic Insights deterministically from data
  const aiInsights = useMemo(() => {
    if (issues.length === 0) return [];
    const list: string[] = [];

    // 1. Largest category of unresolved reports
    const unresolved = issues.filter(i => (i.status as string) !== 'closed' && (i.status as string) !== 'resolved');
    const categoriesCount: Record<string, number> = {};
    unresolved.forEach(i => {
      categoriesCount[i.issue_type] = (categoriesCount[i.issue_type] || 0) + 1;
    });
    let largestType = '';
    let largestCount = 0;
    Object.entries(categoriesCount).forEach(([type, count]) => {
      if (count > largestCount) {
        largestCount = count;
        largestType = type;
      }
    });
    if (largestType) {
      list.push(`${humanizeIssueType(largestType, '')} represents the largest share of unresolved reports (${largestCount} cases).`);
    }

    // 2. Highest active cluster density ward
    if (wardStats.length > 0) {
      const sortedWards = [...wardStats].sort((a, b) => b.clusterCount - a.clusterCount);
      const topWard = sortedWards[0];
      if (topWard && topWard.clusterCount > 0) {
        list.push(`${topWard.wardName} currently has the highest active cluster density (${topWard.clusterCount} clusters).`);
      }
    }

    // 3. Escalation window check
    const oldEscalatedCount = unresolved.filter(i => {
      if (i.status !== 'escalated') return false;
      const ageDays = (new Date().getTime() - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return ageDays > 7;
    }).length;
    if (oldEscalatedCount > 0) {
      list.push(`${oldEscalatedCount} escalated complaint${oldEscalatedCount > 1 ? 's have' : ' has'} exceeded the standard 7-day authority response window.`);
    } else {
      list.push(`All escalated complaints are currently within the standard 7-day response tracking cycle.`);
    }

    // 4. Concentrated issue type
    const wardCategoryMap: Record<string, Record<string, number>> = {};
    unresolved.forEach(i => {
      const { ward } = getLocalityAndWard(i.latitude, i.longitude);
      if (!wardCategoryMap[ward]) wardCategoryMap[ward] = {};
      wardCategoryMap[ward][i.issue_type] = (wardCategoryMap[ward][i.issue_type] || 0) + 1;
    });
    let topWardCat = '';
    let topWardCatCount = 0;
    let topWardName = '';
    Object.entries(wardCategoryMap).forEach(([ward, catMap]) => {
      Object.entries(catMap).forEach(([type, count]) => {
        if (count > topWardCatCount) {
          topWardCatCount = count;
          topWardCat = type;
          topWardName = ward;
        }
      });
    });
    if (topWardCat && topWardCatCount >= 2) {
      list.push(`${humanizeIssueType(topWardCat, '')} complaints remain concentrated around ${topWardName} (${topWardCatCount} reports).`);
    }

    // 5. Verification status
    const verifiedUnresolved = unresolved.filter(i => i.credibility_score >= 0.8).length;
    const pct = unresolved.length > 0 ? Math.round((verifiedUnresolved / unresolved.length) * 100) : 0;
    list.push(`${pct}% of active reports have been successfully verified by Gemini Vision (credibility ≥ 80%).`);

    // 6. Awaiting action
    const awaitingAction = unresolved.filter(i => i.credibility_score >= 0.8 && i.status !== 'escalated').length;
    if (awaitingAction > 0) {
      list.push(`${awaitingAction} verified report${awaitingAction > 1 ? 's are' : ' is'} still awaiting citizen review and authority action.`);
    }

    return list.slice(0, 6);
  }, [issues, wardStats]);

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
      {/* Landing Experience: 10-second value proposition header */}
      <div ref={(el) => registerTourTarget('tracker-header', el)} className="bg-slate-900 text-white rounded-medium p-6 md:p-8 mt-6 shadow-premium relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-950/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3.5">
          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest bg-teal-950/80 px-2 py-0.5 rounded-small border border-teal-800 select-none">
            AI-Grounded Action Platform
          </span>
          <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight leading-tight">
            CivicPulse Operations Center
          </h2>
          <p className="text-xs md:text-sm text-slate-355 font-normal leading-relaxed">
            Every citizen report containing photographic evidence is processed through an automated verification pipeline. The system clusters duplicates, assesses neighborhood safety risk, and drafts reviewable, sendable legal briefs for official action.
          </p>
          <div className="flex flex-wrap items-center gap-y-2 gap-x-1.5 md:gap-x-2.5 py-1 text-[10px] font-bold text-slate-300 select-none border-t border-b border-slate-800/60">
            <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60"><span className="text-teal-400">1</span> Upload</span>
            <span className="text-slate-650 text-[8px]">➔</span>
            <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60"><span className="text-teal-400">2</span> Stage-0 AI Filter</span>
            <span className="text-slate-650 text-[8px]">➔</span>
            <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60"><span className="text-teal-400">3</span> Evidence Cluster</span>
            <span className="text-slate-650 text-[8px]">➔</span>
            <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60"><span className="text-teal-400">4</span> Legal Grievance/RTI</span>
            <span className="text-slate-650 text-[8px]">➔</span>
            <span className="flex items-center gap-1 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800 text-teal-300"><span className="text-teal-400">5</span> Dispatch (SendGrid)</span>
          </div>
          <div className="pt-1.5 flex flex-wrap gap-3">
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
        <LoadingState variant="dashboard" className="mt-6" />
      ) : (
        <div className="mt-6 space-y-6 animate-fade">
          {/* Civic Intelligence Dashboard */}
          <div id="ai-civic-insights-card" ref={(el) => registerTourTarget('ai-insights', el)} className="border border-slate-200 bg-white rounded-medium shadow-subtle overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 select-none">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-primary animate-pulse shrink-0" />
                <span className="text-[10px] font-bold text-slate-755 uppercase tracking-wider font-sans">Civic Intelligence Dashboard</span>
                <HelpTooltip text="Transforms platform data and Stage 0 validation metrics into real-time operational insights." />
              </div>
              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded uppercase tracking-wider select-none shrink-0 font-sans">
                Active Verification Engine
              </span>
            </div>

            {/* Main stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-x divide-y sm:divide-y-0 divide-slate-100 border-b border-slate-100 font-sans">
              {[
                { label: 'Active Clusters', value: Object.keys(clusterCounts).length, sub: 'Spatial groupings', color: 'text-amber-700 font-bold' },
                { label: 'Reports Today', value: issues.filter(i => new Date(i.created_at).toDateString() === new Date().toDateString()).length, sub: 'Logged last 24h', color: 'text-slate-700 font-mono' },
                { label: 'Acceptance Rate', value: metricsData && metricsData.total_validations > 0 ? `${Math.round((metricsData.accepted_uploads / metricsData.total_validations) * 100)}%` : 'N/A', sub: 'Stage 0 pass rate', color: 'text-teal-700 font-extrabold' },
                { label: 'Dupes Blocked', value: metricsData ? metricsData.rejected_uploads : 0, sub: 'Stage 0 filtered', color: 'text-rose-700' },
                { label: 'Gemini Calls Saved', value: metricsData ? metricsData.gemini_calls_saved : 0, sub: 'Via dhash cache', color: 'text-emerald-650 font-bold' },
                { label: 'Avg Latency', value: metricsData && metricsData.average_validation_latency_ms ? `${metricsData.average_validation_latency_ms.toFixed(0)}ms` : 'N/A', sub: 'Validation latency', color: 'text-slate-700 font-mono' },
                { label: 'Total Reports', value: stats.reports, sub: 'Verified pipeline', color: 'text-slate-700' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="px-5 py-4 space-y-1 select-none">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none">{label}</span>
                  <p className={`text-lg font-extrabold tracking-tight ${color}`}>{value}</p>
                  <span className="text-[9px] text-slate-400 block leading-tight">{sub}</span>
                </div>
              ))}
            </div>

            {/* Issue distribution & AI pattern discovery row */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-100 p-5 gap-6 md:gap-0 font-sans">
              <div className="space-y-3.5 pr-0 md:pr-6 select-none">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">AI Pattern Discovery</h4>
                <div className="space-y-2.5">
                  {aiInsights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-650 leading-relaxed font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3.5 pl-0 md:pl-6 select-none">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Issue Distribution</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Road Damage & Potholes', count: issues.filter(i => i.issue_type === 'road_damage').length, color: 'bg-rose-500' },
                    { label: 'Garbage & Waste Accumulation', count: issues.filter(i => i.issue_type === 'garbage' || i.issue_type === 'dumping').length, color: 'bg-amber-500' },
                    { label: 'Street Lighting Faults', count: issues.filter(i => i.issue_type === 'street_lighting').length, color: 'bg-yellow-500' },
                    { label: 'Water Leakage & Drainage', count: issues.filter(i => i.issue_type === 'water').length, color: 'bg-blue-500' },
                  ].map((item) => {
                    const total = issues.length || 1;
                    const pct = Math.round((item.count / total) * 100);
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                          <span>{item.label}</span>
                          <span className="font-bold text-slate-700">{item.count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

            {/* Cross-Issue Silence Ledger Sub-Section */}
            <div id="silence-ledger-container" ref={(el) => registerTourTarget('silence-ledger', el)} className="bg-slate-50/30">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 select-none">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-rose-600" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Cross-Issue Silence Ledger</span>
                  <HelpTooltip text="Tracks cumulative waiting time of unresolved reports to improve civic accountability." />
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
                  { label: 'Active Wards', value: silenceStats.activeWards, icon: Map, sub: 'Wards represented', color: 'text-slate-700' },
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
            <div id="ward-pattern-container" ref={(el) => registerTourTarget('ward-pattern', el)} className="border-t border-slate-100 bg-slate-50/10">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 select-none">
                <div className="flex items-center gap-2">
                  <Map size={14} className="text-teal-600" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Ward Pattern Intelligence</span>
                  <HelpTooltip text="Aggregates issue patterns across wards to identify recurring infrastructure problems." />
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
        {isLoading ? (
          <div className="w-full lg:w-[65%] h-[380px] lg:h-[600px] shrink-0">
            <LoadingState variant="map" />
          </div>
        ) : filteredIssues.length > 0 ? (
          <div id="operations-map-container" ref={(el) => registerTourTarget('operations-map', el)} className="w-full lg:w-[65%] h-[380px] lg:h-[600px] shrink-0 rounded-medium overflow-hidden border border-slate-200/80 shadow-subtle bg-white relative">
            <IssueMap
              issues={filteredIssues}
              selectedIssueId={selectedIssueId}
              onSelectIssue={setSelectedIssueId}
              className="w-full h-full"
            />
          </div>
        ) : null}

        {/* List of Cards (Right Column - Dynamic Flex-1 takes remaining 35%) */}
        <div className="flex-1 flex flex-col max-h-[600px] lg:overflow-y-auto pr-0 lg:pr-2 scrollbar-thin">
          {isLoading ? (
            <LoadingState variant="tracker-card" count={4} />
          ) : filteredIssues.length === 0 ? (
            <EmptyState
              icon={Map}
              title={selectedType !== 'all' || selectedRisk !== 'all' ? "No matching reports yet." : "No reports available yet."}
              description={
                selectedType !== 'all' || selectedRisk !== 'all'
                  ? "No community reports of this category and risk level have been logged yet. Reset active filters or submit the first report for this area."
                  : "Be the first to report an issue in this area."
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
