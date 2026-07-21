import React from 'react';
import { useAdminStore } from '../state/useAdminStore';
import { Surface } from '../../../design-system/primitives/foundation/Surface';
import { Switch } from '../../../design-system/primitives/forms/Switch';
import { Sliders, Cpu, MessageSquare, EyeOff, Award } from 'lucide-react';

export const FeatureFlagDashboard: React.FC = () => {
  const { featureFlags, toggleFeatureFlag } = useAdminStore();

  return (
    <Surface variant="card" className="p-6 space-y-4 font-sans">
      <div className="flex items-center gap-2 text-primary-700 font-semibold border-b border-neutral-100 pb-3">
        <Sliders className="w-5 h-5" />
        <h3 className="text-base text-neutral-900">Runtime System Feature Flags & Operational Toggles</h3>
      </div>

      <div className="space-y-4">
        <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200 flex items-start gap-3">
          <div className="p-2 bg-primary-500/10 text-primary-700 rounded-pill mt-1">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <Switch
              label="Automated AI Triage & Severity Scoring"
              description="Performs instant image classification and severity scoring via Gemini vision models."
              checked={featureFlags.aiAutoTriaging}
              onChange={() => toggleFeatureFlag('aiAutoTriaging')}
            />
          </div>
        </div>

        <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200 flex items-start gap-3">
          <div className="p-2 bg-green-100 text-success rounded-pill mt-1">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <Switch
              label="WhatsApp Municipal Dispatch Workflow"
              description="Sends automated work orders and SLA status updates via official WhatsApp API."
              checked={featureFlags.whatsAppIntegration}
              onChange={() => toggleFeatureFlag('whatsAppIntegration')}
            />
          </div>
        </div>

        <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200 flex items-start gap-3">
          <div className="p-2 bg-violet-100 text-violet-700 rounded-pill mt-1">
            <EyeOff className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <Switch
              label="Anonymous Citizen Reporting Mode"
              description="Allows citizens to mask identity on public feeds while preserving audit verification."
              checked={featureFlags.anonymousReporting}
              onChange={() => toggleFeatureFlag('anonymousReporting')}
            />
          </div>
        </div>

        <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200 flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-900 rounded-pill mt-1">
            <Award className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <Switch
              label="Hackathon Judge & Evaluation Mode (/evaluate)"
              description="Enables dedicated scenario runner and end-to-end journey playback for competition evaluators."
              checked={featureFlags.judgeEvaluationMode}
              onChange={() => toggleFeatureFlag('judgeEvaluationMode')}
            />
          </div>
        </div>
      </div>
    </Surface>
  );
};
