import React from 'react';
import { StatCard } from '../../../design-system/patterns/analytics/StatCard';
import { MetricCard } from '../../../design-system/patterns/analytics/MetricCard';
import { ChartWrapper } from '../../../design-system/patterns/analytics/ChartWrapper';

export const SLAAnalyticsDashboard: React.FC = () => {
  return (
    <div className="space-y-6 font-sans py-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Municipal SLA & Workload Operations Dashboard</h2>
          <p className="text-xs text-neutral-700">Realtime SLA performance, contractor turnaround times, and ward metrics</p>
        </div>

        <span className="text-xs font-mono font-semibold text-success bg-green-100 px-2.5 py-1 rounded-pill">
          Average SLA Compliance: 94.2%
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Open Active Cases"
          value="42"
          sourceText="Executive Work Queue"
          dateRange="Current SLA Window"
        />

        <MetricCard
          title="Avg Response SLA"
          metricValue="14.2 Hours"
          denominatorText="Target: 24h"
          methodologyNote="Measured from citizen timestamp to official acknowledgment."
        />

        <MetricCard
          title="Verified Resolved Today"
          metricValue="18 Cases"
          methodologyNote="Audit confirmed by physical verification votes."
          sampleSize={18}
        />

        <MetricCard
          title="SLA Escalation Alerts"
          metricValue="2 Cases"
          methodologyNote="High severity cases exceeding 48h resolution target."
        />
      </div>

      {/* Department Workload Distribution Chart */}
      <ChartWrapper
        title="Department Workload & Turnaround Distribution"
        unit="Active Cases"
        methodology="Calculated from active assigned case queue items."
        data={[
          { label: 'Public Works Dept', value: 24 },
          { label: 'Jal Board (Water)', value: 12 },
          { label: 'Electrical Dept', value: 6 },
        ]}
      />
    </div>
  );
};
