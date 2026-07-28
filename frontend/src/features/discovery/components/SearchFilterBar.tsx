import React from 'react';
import { Search, LayoutGrid, Map, RotateCcw } from 'lucide-react';
import { Button } from '../../../design-system/primitives/buttons/Button';
import { Select } from '../../../design-system/primitives/forms/Select';
import type { DiscoveryFilterState } from '../state/useDiscoveryFilterStore';
import type { IssueType } from '../../../api/types';

export interface SearchFilterBarProps {
  filters: DiscoveryFilterState;
  onUpdate: (updates: Partial<DiscoveryFilterState>) => void;
  onReset: () => void;
  className?: string;
}

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'road_damage', label: 'Road Damage & Potholes' },
  { value: 'water', label: 'Water Supply & Leaks' },
  { value: 'garbage', label: 'Garbage & Waste Overflow' },
  { value: 'street_lighting', label: 'Street Lighting & Dark Corridors' },
  { value: 'footpath', label: 'Footpath & Pedestrian' },
  { value: 'dumping', label: 'Illegal Dumping' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'In Progress / Active' },
  { value: 'approved', label: 'Action Approved' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'severity', label: 'Highest Severity' },
  { value: 'credibility', label: 'Highest Credibility Score' },
];

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  filters,
  onUpdate,
  onReset,
  className,
}) => {
  return (
    <div className={`p-4 bg-white border border-neutral-200 rounded-lg shadow-subtle font-sans space-y-3 ${className || ''}`}>
      {/* Search Input & View Mode Toggles */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search cases by location, keyword, or ID..."
            value={filters.searchQuery}
            onChange={(e) => onUpdate({ searchQuery: e.target.value })}
            className="w-full min-h-[44px] pl-10 pr-4 text-sm border border-neutral-200 rounded-md font-sans focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <Search className="w-4 h-4 text-neutral-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <Button
            variant={filters.viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onUpdate({ viewMode: 'grid' })}
            leadingIcon={<LayoutGrid className="w-4 h-4" />}
          >
            Grid
          </Button>

          <Button
            variant={filters.viewMode === 'map' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onUpdate({ viewMode: 'map' })}
            leadingIcon={<Map className="w-4 h-4" />}
          >
            Map
          </Button>
        </div>
      </div>

      {/* Filter Select Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-100">
        <Select
          name="categoryFilter"
          label="Category"
          value={filters.category}
          onChange={(e) => onUpdate({ category: e.target.value as 'all' | IssueType })}
          options={CATEGORY_OPTIONS}
        />

        <Select
          name="statusFilter"
          label="Status"
          value={filters.status}
          onChange={(e) => onUpdate({ status: e.target.value as 'all' | 'active' | 'approved' })}
          options={STATUS_OPTIONS}
        />

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Select
              name="sortFilter"
              label="Sort By"
              value={filters.sort}
              onChange={(e) => onUpdate({ sort: e.target.value as 'newest' | 'severity' | 'credibility' })}
              options={SORT_OPTIONS}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            aria-label="Reset all search filters"
            leadingIcon={<RotateCcw className="w-4 h-4 text-neutral-700" />}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};
