import React from 'react';
import { GlobalErrorBoundary } from './core/boundaries/GlobalErrorBoundary';
import { QueryProvider } from './core/providers/QueryProvider';
import { AuthProvider } from './core/providers/AuthProvider';
import { ConnectivityProvider } from './core/providers/ConnectivityProvider';
import { OfflineProvider } from './core/providers/OfflineProvider';
import { ThemeProvider } from './core/providers/ThemeProvider';
import { AccessibilityProvider } from './core/providers/AccessibilityProvider';
import { FeedbackProvider } from './core/providers/FeedbackProvider';
import { PermissionProvider } from './core/providers/PermissionProvider';
import { AppRouter } from './core/router/AppRouter';

export const App: React.FC = () => {
  return (
    <GlobalErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <ConnectivityProvider>
            <OfflineProvider>
              <ThemeProvider>
                <AccessibilityProvider>
                  <FeedbackProvider>
                    <PermissionProvider>
                      {/* WCAG Skip Navigation Link */}
                      <a
                        href="#main-content"
                        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-700 focus:text-white focus:rounded-md focus:shadow-modal"
                      >
                        Skip to main content
                      </a>

                      <AppRouter />
                    </PermissionProvider>
                  </FeedbackProvider>
                </AccessibilityProvider>
              </ThemeProvider>
            </OfflineProvider>
          </ConnectivityProvider>
        </AuthProvider>
      </QueryProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
