import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Map, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TrackerPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="Public Issue Tracker"
        subtitle="Observe active clusters, track agent progress, and monitor collective community reports."
        action={
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-small shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>New Report</span>
          </Link>
        }
      />

      <div className="py-8">
        <EmptyState
          icon={Map}
          title="No reports yet"
          description="Be the first to flag a community issue. Uploading a photo triggers our 5-agent verification and escalation pipeline."
          action={
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-secondary-border bg-white text-xs font-semibold text-secondary-foreground rounded-small hover:bg-slate-50 transition-all shadow-sm"
            >
              Start Intake Flow
            </Link>
          }
        />
      </div>
    </div>
  );
};
export default TrackerPage;
