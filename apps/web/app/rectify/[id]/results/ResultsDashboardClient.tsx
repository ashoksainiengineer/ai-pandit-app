'use client';

import React, { useEffect, useState } from 'react';
import { ResultsDashboard } from '@/components/rectify/ResultsDashboard';
import Layout from '@/components/Layout';
import { Breadcrumbs, predefinedBreadcrumbs } from '@/components/ui/Breadcrumbs';
import { Session } from '@/lib/types';

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
        // Sync with localStorage for future speed/offline availability
        if (initialSession) {
            let analysisResult = initialSession.analysisResult;
            if (typeof analysisResult === 'string') {
                try {
                    analysisResult = JSON.parse(analysisResult);
                } catch (e) {
                    // Keep as string if not JSON
                }
            }

            const sessionData = {
                ...initialSession,
                analysisResult,
                rectifiedTime: initialSession.rectifiedTime || analysisResult?.rectifiedTime,
                accuracy: initialSession.accuracy || analysisResult?.accuracy,
                confidence: initialSession.confidence || analysisResult?.confidence,
            };

            setResultData(sessionData);
            setBirthData(initialSession.birthData);
            setReasoningLogs(initialSession.reasoningLogs);

            if (initialSession.rectifiedTime || analysisResult?.rectifiedTime) {
                // BUG-FIX TODO: Strip PII (fullName, birthPlace) before localStorage storage
                // See AGENTS.md: "Never log secrets, tokens, birth details, or raw PII"
                localStorage.setItem(`rectification_result_${id}`, JSON.stringify(sessionData));
                if (initialSession.birthData) {
                    localStorage.setItem(`birthData_${id}`, JSON.stringify(initialSession.birthData));
                }
                if (initialSession.reasoningLogs) {
                    localStorage.setItem(`reasoningLogs_${id}`, JSON.stringify(initialSession.reasoningLogs));
                }
            }
        }
    }, [id, initialSession]);

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
