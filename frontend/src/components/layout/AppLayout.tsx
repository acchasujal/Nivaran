import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../navigation/Sidebar';
import { BottomNavigation } from '../navigation/BottomNavigation';
import { Container } from './Container';
import { LoadingState } from '../feedback/LoadingState';
import { TourProvider, useTour } from '@/context/TourContext';
import { GuideTourOverlay } from '../shared/GuideTourOverlay';
import { HelpCircle } from 'lucide-react';

const HeaderBar: React.FC = () => {
  const { restartTour } = useTour();
  return (
    <header className="h-14 border-b border-secondary-border bg-white flex items-center justify-between px-6 shrink-0 z-20 select-none">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest md:hidden">CivicPulse</span>
      </div>
      <button
        onClick={restartTour}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-705 text-xs font-bold rounded-small shadow-sm transition-all cursor-pointer select-none active:scale-[0.98]"
      >
        <HelpCircle size={14} className="text-primary animate-pulse" />
        <span>Guide</span>
      </button>
    </header>
  );
};

export const AppLayoutContent: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar Navigation */}
      <Sidebar />

      {/* Main Viewport Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Header Bar with Guide Button */}
        <HeaderBar />

        <Container className="flex-1 flex flex-col">
          {/* Outlet renders active page route */}
          <Suspense fallback={<LoadingState variant="page" message="Loading page..." />}>
            <Outlet />
          </Suspense>
        </Container>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />

      {/* Interactive Tour overlays */}
      <GuideTourOverlay />
    </div>
  );
};

export const AppLayout: React.FC = () => {
  return (
    <TourProvider>
      <AppLayoutContent />
    </TourProvider>
  );
};

export default AppLayout;
