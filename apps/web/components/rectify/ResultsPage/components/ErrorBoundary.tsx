import React from 'react';
import { logger } from '@/lib/secure-logger';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
}

export class ResultsPageErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        logger.error('ResultsPage Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="max-w-4xl mx-auto p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-[#1A1612] mb-2">Something Went Wrong</h2>
                    <p className="text-[#7A756F] mb-4">Failed to display results. Please try refreshing.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-[#78611D] text-white rounded-lg font-medium"
                    >
                        Refresh
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
