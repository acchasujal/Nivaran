import React from 'react';
import { ShieldCheck, Plus, Sparkles, MapPin } from 'lucide-react';
import { Button } from '../../../design-system/primitives/buttons/Button';
import { WhatsAppReportBanner } from '../../../components/issue/WhatsAppReportBanner';

export interface LandingHeroProps {
  onStartReport: () => void;
  onBrowseMap?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onStartReport, onBrowseMap }) => {
  return (
    <div className="space-y-4 font-sans py-4">
      {/* Hero Header Banner */}
      <div className="p-6 bg-gradient-to-br from-primary-700 via-teal-800 to-neutral-900 rounded-xl text-white shadow-premium relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-white/10 text-teal-200 text-xs font-medium backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-teal-300" />
            <span>Public Evidence Infrastructure Platform</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
            Turn Public Evidence Into Official Municipal Action
          </h1>

          <p className="text-sm text-teal-100/90 leading-relaxed">
            Report civic hazards, track cryptographic evidence chains, and audit municipal repairs with community verification.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              onClick={onStartReport}
              leadingIcon={<Plus className="w-5 h-5" />}
              className="bg-white text-primary-700 hover:bg-neutral-100 font-semibold"
            >
              Report Civic Issue
            </Button>

            {onBrowseMap && (
              <Button
                variant="ghost"
                onClick={onBrowseMap}
                leadingIcon={<MapPin className="w-4 h-4 text-white" />}
                className="text-white hover:bg-white/10"
              >
                Browse Map Feed
              </Button>
            )}
          </div>
        </div>

        <Sparkles className="absolute -right-6 -bottom-6 w-48 h-48 text-white/5 pointer-events-none" />
      </div>

      {/* Instant WhatsApp alternative entry banner */}
      <WhatsAppReportBanner />
    </div>
  );
};
