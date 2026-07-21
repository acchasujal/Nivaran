import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { CitizenShell } from '../../layouts/CitizenShell';
import { GovernmentShell } from '../../layouts/GovernmentShell';
import { InternalShell } from '../../layouts/InternalShell';
import { ProtectedRoute } from './ProtectedRoute';
import { SuspenseFallback } from '../boundaries/SuspenseFallback';
import { NotFoundPage } from '../../pages/system/NotFoundPage';
import { ForbiddenPage } from '../../pages/system/ForbiddenPage';
import { ServerErrorPage } from '../../pages/system/ServerErrorPage';
import { OfflinePage } from '../../pages/system/OfflinePage';
import { MaintenancePage } from '../../pages/system/MaintenancePage';

const HomePage = lazy(() => import('../../pages/public/HomePage'));
const DiscoveryPage = lazy(() => import('../../pages/public/DiscoveryPage'));
const IntakePage = lazy(() => import('../../pages/public/IntakePage'));
const TrackerPage = lazy(() => import('../../pages/public/TrackerPage'));
const IssueDetailPage = lazy(() => import('../../pages/public/IssueDetailPage'));
const GovernmentQueuePage = lazy(() => import('../../pages/institutional/GovernmentQueuePage'));
const DocumentReviewPage = lazy(() => import('../../pages/institutional/DocumentReviewPage'));
const SettingsPage = lazy(() => import('../../pages/user/SettingsPage'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <CitizenShell />,
    errorElement: <ServerErrorPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<SuspenseFallback label="Loading home feed..." />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'discover',
        element: (
          <Suspense fallback={<SuspenseFallback label="Loading discovery feed..." />}>
            <DiscoveryPage />
          </Suspense>
        ),
      },
      {
        path: 'report',
        element: (
          <Suspense fallback={<SuspenseFallback label="Loading report form..." />}>
            <IntakePage />
          </Suspense>
        ),
      },
      {
        path: 'tracker',
        element: (
          <Suspense fallback={<SuspenseFallback label="Loading my reports..." />}>
            <TrackerPage />
          </Suspense>
        ),
      },
      {
        path: 'issue/:id',
        element: (
          <Suspense fallback={<SuspenseFallback label="Loading case detail..." />}>
            <IssueDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<SuspenseFallback label="Loading settings..." />}>
            <SettingsPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/government',
    element: (
      <ProtectedRoute allowedRoles={['officer', 'auditor', 'admin']}>
        <GovernmentShell />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'queue',
        element: (
          <Suspense fallback={<SuspenseFallback label="Loading executive queue..." />}>
            <GovernmentQueuePage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/internal',
    element: (
      <ProtectedRoute allowedRoles={['officer', 'auditor', 'admin']}>
        <InternalShell />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'document-review',
        element: (
          <Suspense fallback={<SuspenseFallback label="Loading document review..." />}>
            <DocumentReviewPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/403',
    element: <ForbiddenPage />,
  },
  {
    path: '/500',
    element: <ServerErrorPage />,
  },
  {
    path: '/offline',
    element: <OfflinePage />,
  },
  {
    path: '/maintenance',
    element: <MaintenancePage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
