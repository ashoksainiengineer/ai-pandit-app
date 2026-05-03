/**
 * Global Error Boundary
 * Catches errors in React components and displays a graceful fallback UI
 */

'use client';

import { env } from '@/lib/config/env';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Mail, Clipboard } from 'lucide-react';
import { logger } from '@/lib/secure-logger';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Generate a unique error reference ID
function generateErrorId(): string {
  return `ERR-${Date.now()}-${crypto.randomUUID()}`;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const errorId = generateErrorId();

  useEffect(() => {
    logger.error('Error caught by boundary', error, {
      errorId,
      digest: error.digest,
      isProduction: env.app.isProduction,
    });

    // In production, send to error tracking endpoint
    if (env.app.isProduction && typeof window !== 'undefined') {
      fetch('/api/log-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'error',
          message: `Error boundary: ${error.message}`,
          meta: { errorId, digest: error.digest, url: window.location.href },
          timestamp: new Date().toISOString(),
        }),
        keepalive: true,
      }).catch(() => {
        // Silently fail - error logging should never break the app
      });
    }
  }, [error, errorId]);

  const copyErrorId = () => {
    navigator.clipboard.writeText(errorId);
  };

  return (
    <div className="min-h-screen bg-[#FFFCF8] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Error Card */}
        <div className="bg-white border border-[#F0E8DE] rounded-2xl p-8 shadow-lg">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-[#C65D3B]/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-[#C65D3B]" />
          </div>

          {/* Title */}
          <h1 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612] text-center mb-2">
            Something Went Wrong
          </h1>

          {/* Message */}
          <p className="text-[#7A756F] text-center mb-6">
            We apologize for the inconvenience. Our team has been notified and we&apos;re working to fix this issue.
          </p>

          {/* Error Reference ID */}
          <div className="bg-[#FDF8F3] border border-[#F0E8DE] rounded-xl p-4 mb-6">
            <p className="text-xs text-[#7A756F] uppercase tracking-wider mb-2">Error Reference ID</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-sm text-[#1A1612] bg-white px-3 py-2 rounded border border-[#F0E8DE]">
                {errorId}
              </code>
              <button
                onClick={copyErrorId}
                className="p-2 text-[#7A756F] hover:text-[#B8860B] hover:bg-[#F5EFE7] rounded-lg transition-colors"
                title="Copy error ID"
              >
                <Clipboard className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#A8A39D] mt-2">
              Please provide this ID if you contact support
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#B8860B] to-[#78611D] text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-[#F0E8DE] text-[#4A453F] font-medium rounded-xl hover:bg-[#FDF8F3] transition-colors"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Link>

            <a
              href={`mailto:support@aipandit.com?subject=Error%20Report%20-%20${errorId}`}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-[#7A756F] hover:text-[#B8860B] transition-colors"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>

        {/* Technical Details (Development Only) */}
        {!env.app.isProduction && (
          <div className="mt-6 p-4 bg-[#1A1612] rounded-xl overflow-auto">
            <p className="text-xs text-[#A8A39D] uppercase tracking-wider mb-2">Technical Details (Dev Only)</p>
            <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
