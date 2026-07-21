import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../core/hooks/usePageTitle';
import { LandingHero } from '../../features/reporting/components/LandingHero';
import { DiscoverFeed } from '../../features/reporting/components/DiscoverFeed';

export const HomePage: React.FC = () => {
  usePageTitle('CivicPulse — Public Evidence Platform');
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <LandingHero onStartReport={() => navigate('/report')} />
      <DiscoverFeed />
    </div>
  );
};

export default HomePage;
