'use client';

import React, { useEffect, useState } from 'react';
import { ResultsDashboard } from '@/components/rectify/ResultsDashboard';
import Layout from '@/components/Layout';
import { Breadcrumbs, predefinedBreadcrumbs } from '@/components/ui/Breadcrumbs';
import { Session } from '@/lib/types';
import { logger } from '@/lib/secure-logger';

const safeSetItem = (key: string, value: string): void => {
    try {
        // localStorage quota is ~5MB per origin. Serialized reasoningLogs can exceed this.
        if (value.length > 1_000_000) {
            logger.warn('[ResultsDashboard] Skipping localStorage write — value too large', {
                key,
                sizeBytes: value.length,
            });
            return;
        }
        localStorage.setItem(key, value);
    } catch (err) {
        logger.warn('[ResultsDashboard] localStorage write failed', {
            key,
            error: err instanceof Error ? err.message : String(err),
        });
    }
};

interface ResultsDashboardClientProps {
    id: string;
    initialSession: Session & {
        analysisResult?: any;
        reasoningLogs?: any;
        birthData: any;
    };
}

export function ResultsDashboardClient({ id, initialSession }: ResultsDashboardClientProps) {
    const [resultData, setResultData] = useState<any>(initialSession);
    const [birthData, setBirthData] = useState<any>(initialSession?.birthData);
    const [reasoningLogs, setReasoningLogs] = useState<any>(initialSession?.reasoningLogs);

    useEffect(() => {
        if (initialSession) {
            let analysisResult = initialSession.analysisResult;
            if (typeof analysisResult === 'string') {
                try {
                    analysisResult = JSON.parse(analysisResult);
                } catch {
                    analysisResult = null;
                }
            }

            const sessionData = {
                ...initialSession,
                analysisResult,
                rectifiedTime: initialSession.rectifiedTime ?? analysisResult?.rectifiedTime ?? null,
                accuracy: initialSession.accuracy ?? analysisResult?.accuracy ?? null,
                confidence: initialSession.confidence ?? analysisResult?.confidence ?? null,
            };

            setResultData(sessionData);
            setBirthData(initialSession.birthData);
            setReasoningLogs(initialSession.reasoningLogs);

            if (sessionData.rectifiedTime) {
                const safeResult = {
                    rectifiedTime: sessionData.rectifiedTime,
                    accuracy: sessionData.accuracy,
                    confidence: sessionData.confidence,
                };
                safeSetItem(`rectification_result_${id}`, JSON.stringify(safeResult));
                if (initialSession.reasoningLogs) {
                    safeSetItem(`reasoningLogs_${id}`, JSON.stringify(initialSession.reasoningLogs));
                }
            }
        }
    }, [id, initialSession, setResultData, setBirthData, setReasoningLogs]);

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-6 pt-6">
                <Breadcrumbs items={predefinedBreadcrumbs.results(id)} className="mb-6" />
            </div>
            <ResultsDashboard
                sessionId={id}
                data={resultData}
                birthData={birthData}
                reasoningLogs={reasoningLogs}
            />
        </Layout>
    );
}
