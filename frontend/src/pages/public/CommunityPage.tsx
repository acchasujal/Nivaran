import React from 'react';
import { usePageTitle } from '../../core/hooks/usePageTitle';
import { CommunityActivityFeed } from '../../features/community/components/CommunityActivityFeed';
import { VerificationVotePanel } from '../../features/community/components/VerificationVotePanel';
import { AdditionalEvidenceForm } from '../../features/community/components/AdditionalEvidenceForm';
import { VolunteerDirectory } from '../../features/community/components/VolunteerDirectory';
import { CommunityTrustCard } from '../../features/community/components/CommunityTrustCard';

export const CommunityPage: React.FC = () => {
  usePageTitle('Community Collaboration & Verification Hub — nivaran');

  return (
    <div className="space-y-6 font-sans py-2">
      <CommunityTrustCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VerificationVotePanel caseId="iss-001" />
        <AdditionalEvidenceForm caseId="CP-2026-881" onEvidenceSubmit={(data) => console.log('Evidence submitted:', data)} />
      </div>

      <VolunteerDirectory />

      <CommunityActivityFeed />
    </div>
  );
};

export default CommunityPage;
