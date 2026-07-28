import React from 'react';
import { IssueMap } from '../../../components/issue/IssueMap';
import { MapWrapper } from '../../../design-system/patterns/maps/MapWrapper';
import { CaseGridFeed } from './CaseGridFeed';
import type { Issue } from '../../../api/types';

export interface InteractiveMapExperienceProps {
  issues: Issue[];
  onSelectCase: (id: string) => void;
  className?: string;
}

export const InteractiveMapExperience: React.FC<InteractiveMapExperienceProps> = ({
  issues,
  onSelectCase,
  className,
}) => (
  <div className={`space-y-3 font-sans ${className || ''}`}>
    <MapWrapper
      title="Civic Reports Spatial Map View"
      listFallback={<CaseGridFeed issues={issues} onSelectCase={onSelectCase} />}
    >
      <IssueMap
        issues={issues}
        selectedIssueId={null}
        onSelectIssue={onSelectCase}
        className="w-full min-h-[420px]"
      />
    </MapWrapper>
  </div>
);
