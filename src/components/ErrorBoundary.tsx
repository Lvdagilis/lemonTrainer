import { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#0a0a0a',
          color: '#fff',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#facc15' }}>
            Oops! Something went wrong
          </h1>
          <p style={{ marginBottom: '2rem', maxWidth: '600px' }}>
            The app encountered an unexpected error. Please try refreshing the page.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <details style={{
              marginTop: '2rem',
              textAlign: 'left',
              backgroundColor: '#1a1a1a',
              padding: '1rem',
              borderRadius: '8px',
              maxWidth: '800px',
              width: '100%',
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                Error Details (dev mode)
              </summary>
              <pre style={{
                fontSize: '0.875rem',
                overflow: 'auto',
                color: '#ef4444',
              }}>
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '2rem',
              padding: '12px 24px',
              fontSize: '1rem',
              backgroundColor: '#facc15',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
