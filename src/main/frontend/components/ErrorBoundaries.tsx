import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

class BaseErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < (this.props.maxRetries || 3);

      return (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.75rem',
          margin: '1rem',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😵</div>
          
          <h2 style={{
            color: '#dc2626',
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            Oops! Something went wrong
          </h2>
          
          <p style={{
            color: '#7f1d1d',
            marginBottom: '2rem',
            fontSize: '1rem',
            lineHeight: '1.5'
          }}>
            We encountered an unexpected error. Your data is safe and this has been logged.
          </p>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center'
          }}>
            {canRetry && (
              <button
                onClick={this.handleRetry}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Try Again ({(this.props.maxRetries || 3) - this.state.retryCount} left)
              </button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: 'white',
                color: '#dc2626',
                border: '1px solid #fecaca',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specific Error Boundaries for your app
export const ExamErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => (
  <BaseErrorBoundary fallback={fallback}>
    {children}
  </BaseErrorBoundary>
);

export const SearchErrorBoundary: React.FC<{
  children: ReactNode;
  onError?: (error: Error) => void;
}> = ({ children, onError }) => (
  <BaseErrorBoundary onError={onError} maxRetries={2}>
    {children}
  </BaseErrorBoundary>
);

export const PageErrorBoundary: React.FC<{
  children: ReactNode;
}> = ({ children }) => (
  <BaseErrorBoundary maxRetries={1}>
    {children}
  </BaseErrorBoundary>
);