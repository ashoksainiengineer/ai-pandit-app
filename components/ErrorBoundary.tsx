'use client';

import React, { ReactNode } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    // Clear any cached data that might be causing issues
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rectify_birth_data');
      localStorage.removeItem('rectify_physical_desc');
      localStorage.removeItem('rectify_life_events');
    }
    
    // Reset state
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A1614] to-[#241F1C] p-4">
          <div className="max-w-md w-full bg-[#241F1C] border border-[#3A3330] rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              {/* Error Icon */}
              <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>

              {/* Error Title */}
              <h2 className="text-2xl font-bold text-[#F5F0EB] mb-4">
                Something Went Wrong
              </h2>

              {/* Error Message */}
              <p className="text-[#C4B8AD] mb-6">
                {this.state.error?.message || 'An unexpected error occurred while processing your request.'}
              </p>

              {/* Error Details (Collapsible) */}
              {this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-[#8C7F72] hover:text-[#C4B8AD] transition-colors">
                    Technical Details
                  </summary>
                  <div className="mt-3 p-4 bg-black/30 rounded-lg border border-[#3A3330]">
                    <pre className="text-xs text-[#8C7F72] overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <div className="mt-2 pt-2 border-t border-[#3A3330]">
                        <p className="text-xs text-[#8C7F72]">Component: {this.state.errorInfo.componentStack}</p>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#E8A849] hover:bg-[#F0B85A] text-[#1A1614] rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <RotateCw className="w-4 h-4" />
                  Try Again (Clear Data)
                </button>

                <button
                  onClick={this.handleReset}
                  className="w-full px-6 py-3 border border-[#3A3330] text-[#C4B8AD] hover:text-[#F5F0EB] hover:border-[#C4B8AD] rounded-lg font-medium transition-all duration-200"
                >
                  Reset Without Clearing Data
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 text-[#8C7F72] hover:text-[#C4B8AD] rounded-lg font-medium transition-all duration-200"
                >
                  Refresh Page
                </button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-[#8C7F72] mt-6">
                If the problem persists, please try refreshing the page or contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple error boundary for specific components
 */
export class SimpleErrorBoundary extends React.Component<Props, { hasError: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SimpleErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Component Error</span>
          </div>
          <p className="text-xs text-red-400/80 mt-1">
            This component encountered an error. Try refreshing the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}