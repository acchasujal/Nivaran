import React, { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from './components/layout/AppLayout';

const IntakePage = lazy(() => import('./pages/IntakePage'));
const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const IssueDetailPage = lazy(() => import('./pages/IssueDetailPage'));

// Initialize the TanStack Query Client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

// Configure the client routing structure
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: '',
        element: <IntakePage />,
      },
      {
        path: 'tracker',
        element: <TrackerPage />,
      },
      {
        path: 'issue/:id',
        element: <IssueDetailPage />,
      },
    ],
  },
]);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

export default App;
