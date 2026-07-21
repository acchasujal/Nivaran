import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '../../design-system/primitives/feedback/ErrorState';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CivicPulse ErrorBoundary] Caught unhandled runtime exception:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full">
            <ErrorState
              title="Unexpected Application Failure"
              description={
                this.state.error?.message ||
                'An unexpected frontend error occurred. Your local draft data has been preserved.'
              }
              onRetry={this.handleReset}
              retryLabel="Reload Application"
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
