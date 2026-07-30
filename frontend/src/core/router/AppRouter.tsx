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
const CommunityPage = lazy(() => import('../../pages/public/CommunityPage'));
const EvaluationPage = lazy(() => import('../../pages/public/EvaluationPage'));
const IntakePage = lazy(() => import('../../pages/IntakePage'));
const TrackerPage = lazy(() => import('../../pages/TrackerPage'));
const IssueDetailPage = lazy(() => import('../../pages/IssueDetailPage'));
const MyReportsPage = lazy(() => import('../../pages/user/MyReportsPage'));
const NotificationsPage = lazy(() => import('../../pages/user/NotificationsPage'));
const GovernmentQueuePage = lazy(() => import('../../pages/institutional/GovernmentQueuePage'));
const DocumentReviewPage = lazy(() => import('../../pages/institutional/DocumentReviewPage'));
const AdminPage = lazy(() => import('../../pages/institutional/AdminPage'));
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
        path: 'community',
        element: (
          <Suspense fallback={<SuspenseFallback label="Loading community hub..." />}>
            <CommunityPage />
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
        path: 'my-reports',
        element: (
          <Suspense fallback={<SuspenseFallback label="Loading reports dashboard..." />}>
            <MyReportsPage />
          </Suspense>
        ),
      },
      {
        path: 'notifications',
        element: (
          <Suspense fallback={<SuspenseFallback label="Loading notifications..." />}>
            <NotificationsPage />
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
      <ProtectedRoute allowedRoles={['officer', 'department_admin', 'auditor', 'admin']}>
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
      <ProtectedRoute allowedRoles={['officer', 'department_admin', 'auditor', 'admin']}>
        <InternalShell />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'document-review/:issueId',
        element: (
          <Suspense fallback={<SuspenseFallback label="Loading document review..." />}>
            <DocumentReviewPage />
          </Suspense>
        ),
      },
      {
        path: 'admin',
        element: (
          <Suspense fallback={<SuspenseFallback label="Loading admin console..." />}>
            <AdminPage />
          </Suspense>
        ),
      },
      {
        path: 'evaluate',
        element: (
          <ProtectedRoute allowedRoles={['auditor', 'admin']} requiredFeatureFlag="enableInternalEvaluation">
            <Suspense fallback={<SuspenseFallback label="Loading evaluation mode..." />}>
              <EvaluationPage />
            </Suspense>
          </ProtectedRoute>
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
