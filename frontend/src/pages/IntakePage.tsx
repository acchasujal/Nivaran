import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { AgentTimeline } from '@/components/timeline/AgentTimeline';
import { Camera } from 'lucide-react';

export const IntakePage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="Report an Issue"
        subtitle="Upload evidence of a local civic issue to trigger collective community accountability."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 items-start">
        {/* Left side: Upload card placeholder */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-dashed border-slate-300 rounded-large bg-white p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
            <div className="h-14 w-14 rounded-full bg-slate-50 border border-secondary-border flex items-center justify-center text-slate-400 mb-4">
              <Camera size={28} className="stroke-[1.5]" />
            </div>
            <h3 className="text-base font-semibold text-secondary-foreground">
              Sumbit Evidence
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
              Camera intake and upload components will be connected here. Only real photo evidence is accepted.
            </p>
          </div>
        </div>

        {/* Right side: Real-time Agent progress */}
        <div className="lg:col-span-5 border border-secondary-border bg-white rounded-large p-6">
          <h3 className="text-sm font-semibold text-secondary-foreground mb-4">
            AI Agent Action Flow
          </h3>
          <AgentTimeline issueStatus="pending" />
        </div>
      </div>
    </div>
  );
};
export default IntakePage;
