import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppBar } from '../design-system/composites/navigation/AppBar';
import { Container } from '../design-system/primitives/foundation/Container';

export const InternalShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900">
      <AppBar title="CivicPulse System Administration & Audit Log" />
      <main className="flex-1 py-6">
        <Container width="wide">
          <Outlet />
        </Container>
      </main>
    </div>
  );
};
