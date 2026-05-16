'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStreamStore } from '@/lib/store/stream-store';
import { useAuth } from '@clerk/nextjs';

const POLL_INTERVAL_MS = 4000;

export function useAnalysisPolling(sessionId: string | null) {
    const dispatchStreamEvent = useStreamStore((s) => s.dispatchStreamEvent);
    const setSessionId = useStreamStore((s) => s.setSessionId);
    const { getToken } = useAuth();

    const lastSeqRef = useRef(0);
    const pollTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const mountedRef = useRef(true);
    const completeRef = useRef(false);

    const poll = useCallback(async () => {
        if (!sessionId || !mountedRef.current || completeRef.current) return;

        try {
            const token = await getToken();
            const since = lastSeqRef.current;
            const url = `/api/analysis/progress?sessionId=${encodeURIComponent(sessionId)}&since=${since}`;

            const res = await fetch(url, {
                headers: { Authorization: token ? `Bearer ${token}` : '' },
                cache: 'no-store',
            });

            if (!res.ok) {
                scheduleNext();
                return;
            }

            const result = await res.json();
            if (!result?.success) {
                scheduleNext();
                return;
            }

            const data = result.data;

            if (data.lastSeq > lastSeqRef.current) {
                lastSeqRef.current = data.lastSeq;
            }

            if (data.events && data.events.length > 0) {
                for (const eventObj of data.events) {
                    if (eventObj.event && typeof eventObj.event.type === 'string') {
                        dispatchStreamEvent(
                            eventObj.event.type as string,
                            eventObj.event as Record<string, unknown>
                        );
                    }
                }
            }

            if (data.status === 'complete' || data.status === 'failed' || data.status === 'cancelled') {
                completeRef.current = true;
                return;
            }

            scheduleNext();
        } catch {
            scheduleNext();
        }
    }, [sessionId, getToken, dispatchStreamEvent]);

    const scheduleNext = useCallback(() => {
        if (!mountedRef.current || completeRef.current) return;
        pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    }, [poll]);

    useEffect(() => {
        mountedRef.current = true;
        lastSeqRef.current = 0;
        completeRef.current = false;

        if (sessionId) {
            setSessionId(sessionId);
            poll();
        }

        return () => {
            mountedRef.current = false;
            if (pollTimerRef.current) {
                clearTimeout(pollTimerRef.current);
            }
        };
    }, [sessionId, poll, setSessionId]);
}
