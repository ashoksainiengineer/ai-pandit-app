'use client';

import React, { useEffect, useId } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { logger } from '@/lib/secure-logger';
import { AnalysisErrorBoundary } from '@/components/rectify/AnalysisErrorBoundary';
import { RectifyEmptyState, RectifyErrorState } from '@/components/rectify/analysis/RectifyEmptyState';
import { RectifySessionHeader } from '@/components/rectify/analysis/RectifySessionHeader';
import { RectifyProgressIndicator } from '@/components/rectify/analysis/RectifyProgressIndicator';
import { RectifyResultsPanel } from '@/components/rectify/analysis/RectifyResultsPanel';
import { useAnalysisSession } from '@/hooks/use-analysis-session';
import { useAnalysisActions } from '@/hooks/use-analysis-actions';
import { env } from '@/lib/config/env';
import dynamic from 'next/dynamic';
import '@/app/globals.css';


const SSEDebugPanel = env.app.isDevelopment
  ? dynamic(() => import('@/components/dev/SSEDebugPanel'), { ssr: false })
  : () => null;


export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const sessionId = params.id as string;
  const pageTitleId = useId();

  const session = useAnalysisSession(sessionId, isLoaded ?? false, isSignedIn ?? false, getToken);
  const actions = useAnalysisActions(sessionId);

  useEffect(() => {
    if (session.metadata?.status === 'cancelled') actions.setCancelled(true);
    else if (session.metadata?.status && ['pending', 'queued', 'processing', 'retrying'].includes(session.metadata.status)) actions.setCancelled(false);
  }, [session.metadata?.status, session.isComplete, actions]);

  useEffect(() => {
    if (session.isComplete) {
      if (session.connectionState.status === 'idle' || session.connectionState.status === 'connecting') return;
      if (session.result) {
        try {
          localStorage.setItem(`rectification_result_${sessionId}`, JSON.stringify({
            rectifiedTime: session.result.rectifiedTime,
            accuracy: session.result.accuracy,
            confidence: session.result.confidence,
          }));
        } catch (err) { console.warn('[Rectify] localStorage unavailable:', err); }
      }
      logger.info('Analysis complete. Staying on page for review.', { sessionId });
    }
  }, [session.isComplete, session.result, sessionId, session.connectionState.status]);

  if (!isLoaded) {
    return <RectifyEmptyState />;
  }

  if (!isSignedIn && (typeof window === 'undefined' || !(window as { isTestEnv?: boolean }).isTestEnv)) {
    router.push('/sign-in');
    return <RectifyEmptyState />;
  }

  if (!session.isConnected && !session.hasError && !session.result && !session.hasData && session.connectionState.status !== 'polling' && session.connectionState.status !== 'connecting') {
    return <RectifyEmptyState />;
  }

  if (session.hasError && !session.result && session.connectionState.status === 'error') {
    return (
      <RectifyErrorState
        error={session.errorMessage}
        onRetry={() => {
          router.refresh();
        }}
      />
    );
  }

  return (
    <AnalysisErrorBoundary sectionName="Analysis Page">
      <main className="min-h-screen font-sans bg-[var(--prism-canvas)]" aria-labelledby={pageTitleId}>
        <RectifySessionHeader
          sessionId={sessionId}
          metadata={session.metadata}
          elapsedSeconds={session.elapsedSeconds}
          isComplete={session.isComplete}
          isCancelling={actions.isCancelling}
          cancelled={actions.cancelled}
          showCancelConfirm={actions.showCancelConfirm}
          onShowCancelConfirm={actions.setShowCancelConfirm}
          onCancel={actions.handleCancel}
          pageTitleId={pageTitleId}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          <RectifyProgressIndicator
            progress={session.progress}
            candidateScoresLength={session.candidateScores.length}
            totalCandidates={session.totalCandidates}
            analyzedCount={session.analyzedCount}
            elapsedSeconds={session.elapsedSeconds}
            isConnected={session.isConnected}
            isComplete={session.isComplete}
            activeAIStage={session.activeAIStage}
            offsetMinutes={session.offsetMinutes}
            cancelled={actions.cancelled}
            metadata={session.metadata}
            result={session.result}
            sessionId={sessionId}
            isCancelling={actions.isCancelling}
            onRestart={actions.handleRestart}
          />

          <RectifyResultsPanel
            progress={session.progress}
            isComplete={session.isComplete}
            isConnected={session.isConnected}
            cancelled={actions.cancelled}
            candidateScores={session.candidateScores}
            sortedCandidateScores={session.sortedCandidateScores}
            candidatesByStage={session.candidatesByStage}
            stageHistory={session.stageHistory}
            stageStats={session.stageStats}
            allSteps={session.allSteps}
            activeAIStage={session.activeAIStage}
            offsetMinutes={session.offsetMinutes}
            sessionId={sessionId}
            advancedSignals={session.advancedSignals}
            onStageClick={session.handleStageClick}
          />
        </div>
      </main>
      <SSEDebugPanel />
    </AnalysisErrorBoundary>
  );
}
