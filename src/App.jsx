/**
 * App.js - Main Application Entry Point
 * 
 * The root component of the Weekly Planner application. This file serves as the
 * main entry point and renders the PlannerDashboard component.
 * 
 * Features:
 * - Global error boundary for graceful error handling
 * - Application-wide styling and theme setup
 * - Performance monitoring setup (if needed)
 * - Root-level providers for context (if expanded in future)
 * 
 * This minimal approach keeps the entry point clean while allowing for
 * future expansion of global app concerns like theming, authentication,
 * or global state management.
 */


// imports
import React from 'react';
import PlannerDashboard from './Components/PlannerDashboard.jsx';


/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the
 * component tree that crashed.
 */


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Weekly Planner Error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Here you could also log the error to an error reporting service
    // like Sentry, LogRocket, etc.
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f4ff',
          padding: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.15)',
            border: '2px solid #c7dbff',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <h1 style={{
              color: '#4338ca',
              fontSize: '24px',
              marginBottom: '16px',
              fontWeight: 'bold'
            }}>
              Oops! Something went wrong
            </h1>
            
            <p style={{
              color: '#6b7280',
              fontSize: '16px',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              The Weekly Planner encountered an unexpected error. 
              Your saved data remains in this browser. Reload to try again.
            </p>

            <div style={{
              backgroundColor: '#f0f4ff',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #c7dbff'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#4338ca',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Quick fixes to try:
              </p>
              <ul style={{
                textAlign: 'left',
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.4'
              }}>
                <li>Refresh the page (Ctrl+R or Cmd+R)</li>
                <li>Keep this browser’s site data to preserve your planner</li>
                <li>Try using a different browser</li>
                <li>Check the browser console for more details</li>
              </ul>
            </div>

            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4f46e5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6366f1'}
            >
              Reload Application
            </button>

            {/* Development error details (only show in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: '24px',
                textAlign: 'left',
                fontSize: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#dc2626',
                  marginBottom: '8px'
                }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  color: '#7f1d1d',
                  fontSize: '11px',
                  lineHeight: '1.4'
                }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    // Render children normally when there's no error
    return this.props.children;
  }
}

/**
 * Main App Component
 * 
 * The root component that renders the entire application.
 * Currently just renders the PlannerDashboard, but can be
 * extended for additional app-wide features.
 */
function App() {
  // Set up global styles if needed (could also be in index.css)
  React.useEffect(() => {
    // Set the document title
    document.title = 'Weekly Planner - ADHD-Friendly Planning App';
    
    // Add any global app initialization here
    // For example: analytics, service worker registration, etc.
    
    // Optional: Add meta description for better SEO if this becomes a web app
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'A comprehensive weekly planner with drag-and-drop scheduling, multi-schedule overlays, and ADHD-friendly todo management.'
      );
    }
  }, []);

  return (
    <ErrorBoundary>
      <div className="App">
        <PlannerDashboard />
      </div>
    </ErrorBoundary>
  );
}

export default App;