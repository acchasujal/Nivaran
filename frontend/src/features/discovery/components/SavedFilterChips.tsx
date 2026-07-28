import React from 'react';
import { Tag } from 'lucide-react';
import type { DiscoveryFilterState } from '../state/useDiscoveryFilterStore';

export interface SavedFilterChipsProps {
  onApplyPreset: (updates: Partial<DiscoveryFilterState>) => void;
}

const PRESETS: { label: string; filter: Partial<DiscoveryFilterState> }[] = [
  { label: '🔥 High Severity Road Hazards', filter: { category: 'road_damage', sort: 'severity' } },
  { label: '💧 Water Leaks', filter: { category: 'water' } },
  { label: '✅ Action Approved', filter: { status: 'approved' } },
  { label: '🛡 High Credibility Evidence', filter: { sort: 'credibility' } },
];

export const SavedFilterChips: React.FC<SavedFilterChipsProps> = ({ onApplyPreset }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 font-sans py-1">
      <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
        <Tag className="w-3.5 h-3.5 text-neutral-700" /> Presets:
      </span>
      {PRESETS.map((p, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onApplyPreset(p.filter)}
          className="text-xs font-medium text-neutral-900 bg-white border border-neutral-200 hover:border-primary-500 hover:bg-primary-50 px-2.5 py-1 rounded-pill transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 min-h-[36px] flex items-center"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};
