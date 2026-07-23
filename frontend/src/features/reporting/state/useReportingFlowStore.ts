import { useState } from 'react';
import type { IssueType, IssueDetailResponse } from '../../../api/types';

export interface ReportingState {
  step: number; // 1: Entry/Upload, 2: Review/Location, 3: Trust/AI, 4: Community Match, 5: Human Approval, 6: Success
  photoFile: File | null;
  photoPreviewUrl: string | null;
  altText: string;
  latitude: number | null;
  longitude: number | null;
  locality: string;
  issueType: IssueType;
  userNote: string;
  createdIssueResponse: IssueDetailResponse | null;
  createdIssueId: string | null;
  communityChoice: 'join' | 'new';
  consented: boolean;
}

const INITIAL_STATE: ReportingState = {
  step: 1,
  photoFile: null,
  photoPreviewUrl: null,
  altText: '',
  latitude: null,
  longitude: null,
  locality: '',
  issueType: 'road_damage',
  userNote: '',
  createdIssueResponse: null,
  createdIssueId: null,
  communityChoice: 'join',
  consented: false,
};

export function useReportingFlowState() {
  const [state, setState] = useState<ReportingState>(INITIAL_STATE);

  const updateState = (updates: Partial<ReportingState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    setState((prev) => ({ ...prev, step: Math.min(6, prev.step + 1) }));
  };

  const prevStep = () => {
    setState((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  };

  const resetFlow = () => {
    setState(INITIAL_STATE);
  };

  return {
    state,
    updateState,
    nextStep,
    prevStep,
    resetFlow,
  };
}
