import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../navigation/Sidebar';
import { BottomNavigation } from '../navigation/BottomNavigation';
import { Container } from './Container';
import { LoadingState } from '../feedback/LoadingState';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar Navigation */}
      <Sidebar />

      {/* Main Viewport Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <Container className="flex-1 flex flex-col">
          {/* Outlet renders active page route */}
          <Suspense fallback={<LoadingState variant="page" message="Loading page..." />}>
            <Outlet />
          </Suspense>
        </Container>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};
export default AppLayout;
