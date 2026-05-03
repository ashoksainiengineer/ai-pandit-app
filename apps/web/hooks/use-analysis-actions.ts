'use client';

import { useState, useCallback } from 'react';
import { useStreamStore } from '@/lib/store/stream-store';
import { logger } from '@/lib/secure-logger';
import { cancelAnalysis, restartAnalysis } from '@/app/rectify/[id]/actions';

export function useAnalysisActions(sessionId: string) {
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelled, setCancelled] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const handleCancel = useCallback(async () => {
        if (isCancelling || cancelled) return;
        setIsCancelling(true);
        try {
            const res = await cancelAnalysis(sessionId);
            if (res.success) {
                setCancelled(true);
            } else {
                alert(`Failed to cancel: ${res.error}`);
            }
        } catch (err: unknown) {
            logger.error('Cancel call failed', err);
            alert(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsCancelling(false);
            setShowCancelConfirm(false);
        }
    }, [sessionId, isCancelling, cancelled]);

    const handleRestart = useCallback(async () => {
        setIsCancelling(true);
        try {
            const res = await restartAnalysis(sessionId);
            if (res.success) {
                useStreamStore.getState().clearStore();
                setCancelled(false);
                window.location.reload();
            } else {
                alert(`Failed to restart: ${res.error}`);
            }
        } catch (err: unknown) {
            logger.error('Restart call failed', err instanceof Error ? err.message : String(err));
            alert(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsCancelling(false);
        }
    }, [sessionId]);

    return {
        isCancelling,
        cancelled,
        showCancelConfirm,
        setShowCancelConfirm,
        setCancelled,
        handleCancel,
        handleRestart,
    };
}
