import React from 'react';
import { usePageTitle } from '../../core/hooks/usePageTitle';
import { CommunityActivityFeed } from '../../features/community/components/CommunityActivityFeed';
import { VolunteerDirectory } from '../../features/community/components/VolunteerDirectory';
import { CommunityTrustCard } from '../../features/community/components/CommunityTrustCard';

export const CommunityPage: React.FC = () => {
  usePageTitle('Community Collaboration & Verification Hub - nivaran');

  return (
    <div className="space-y-6 font-sans py-2">
      <CommunityTrustCard />
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-700">
        Select a case from Discover to submit evidence or cast a verification vote. Case-specific actions are not shown without a real case context.
      </div>
      <VolunteerDirectory />
      <CommunityActivityFeed />
    </div>
  );
};

export default CommunityPage;
