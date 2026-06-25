import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { AgentTimeline } from '@/components/timeline/AgentTimeline';
import { ArrowLeft } from 'lucide-react';

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex-1 flex flex-col">
      <div className="pt-6">
        <Link
          to="/tracker"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Tracker</span>
        </Link>
      </div>

      <PageHeader
        title={`Issue Detail`}
        subtitle={`Monitoring and verifying report context for ID: ${id || 'N/A'}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 items-start">
        {/* Left column: Evidence summaries and cards */}
        <div className="lg:col-span-8 space-y-6">
          <div className="border border-secondary-border bg-white rounded-large p-6">
            <h3 className="text-sm font-semibold text-secondary-foreground mb-2">
              Evidence Context
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real photo verification and Gemini classifications will display in this container.
            </p>
          </div>
        </div>

        {/* Right column: Action timelines */}
        <div className="lg:col-span-4 border border-secondary-border bg-white rounded-large p-6">
          <h3 className="text-sm font-semibold text-secondary-foreground mb-4">
            Escalation Process
          </h3>
          <AgentTimeline issueStatus="clustered" hasImpactSummary={false} />
        </div>
      </div>
    </div>
  );
};
export default IssueDetailPage;
