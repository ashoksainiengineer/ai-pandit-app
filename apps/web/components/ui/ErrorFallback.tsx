'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Mail, Clipboard } from 'lucide-react';
import { env } from '@/lib/config/env';

interface ErrorFallbackProps {
  title: string;
  message: string;
  showDetails?: boolean;
  onReset?: () => void;
  error?: Error & { digest?: string };
  errorId?: string;
  homeHref?: string;
  homeLabel?: string;
  supportHref?: string;
}

export default function ErrorFallback({
  title,
  message,
  showDetails = false,
  onReset,
  error,
  errorId,
  homeHref = '/',
  homeLabel = 'Return Home',
  supportHref = 'mailto:support@aipandit.com',
}: ErrorFallbackProps) {
  const copyErrorId = () => {
    if (errorId) {
      navigator.clipboard.writeText(errorId);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Error Card */}
        <div className="bg-white border border-surface-muted rounded-2xl p-8">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          {/* Title */}
          <h1 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-content-primary text-center mb-2">
            {title}
          </h1>

          {/* Message */}
          <p className="text-content-secondary text-center mb-6">{message}</p>

          {/* Error Reference ID */}
          {errorId && (
            <div className="bg-surface-raised border border-surface-muted rounded-xl p-4 mb-6">
              <p className="text-xs text-content-secondary uppercase tracking-wider mb-2">Error Reference ID</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm text-content-primary bg-white px-3 py-2 rounded border border-surface-muted">
                  {errorId}
                </code>
                <button
                  onClick={copyErrorId}
                  className="p-2 text-content-secondary hover:text-primary hover:bg-surface-elevated rounded-lg transition-colors"
                  title="Copy error ID"
                >
                  <Clipboard className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-content-disabled mt-2">
                Please provide this ID if you contact support
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {onReset && (
              <button
                onClick={onReset}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}

            <Link
              href={homeHref}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-surface-muted text-content-secondary font-medium rounded-xl hover:bg-surface-raised transition-colors"
            >
              <Home className="w-4 h-4" />
              {homeLabel}
            </Link>

            <a
              href={supportHref}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-content-secondary hover:text-primary transition-colors"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>

        {/* Technical Details (Development Only) */}
        {showDetails && error && !env.app.isProduction && (
          <div className="mt-6 p-4 bg-content-primary rounded-xl overflow-auto">
            <p className="text-xs text-content-disabled uppercase tracking-wider mb-2">Technical Details (Dev Only)</p>
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
