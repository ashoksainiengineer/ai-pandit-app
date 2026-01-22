'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ResultsDashboard } from '@/components/rectify/ResultsDashboard';
import { useStreamProgress } from '@/lib/use-stream-progress';

export default function ResultsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [resultData, setResultData] = useState<any>(null);
    const [birthData, setBirthData] = useState<any>(null);
    const [reasoningLogs, setReasoningLogs] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Hydrate from localStorage first for speed
    useEffect(() => {
        if (!id) return;

        // 1. Try Local Storage (Fastest)
        const stored = localStorage.getItem(`rectification_result_${id}`);
        const storedBirthData = localStorage.getItem(`birthData_${id}`);
        const storedLogs = localStorage.getItem(`reasoningLogs_${id}`);

        if (stored) {
            try {
                setResultData(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse stored result", e);
            }
        }

        if (storedBirthData) {
            try {
                setBirthData(JSON.parse(storedBirthData));
            } catch (e) {
                console.error("Failed to parse stored birth data", e);
            }
        }

        if (storedLogs) {
            try {
                setReasoningLogs(JSON.parse(storedLogs));
            } catch (e) {
                console.error("Failed to parse stored logs", e);
            }
        }

        // 2. Fetch from API if not in local storage (for shared links or manual refresh)
        const fetchFromServer = async () => {
            try {
                console.log('📡 [Results] Local data missing. Hydrating from API...');
                const res = await fetch(`/api/sessions/${id}`);
                const data = await res.json();

                if (data.success && data.data) {
                    const session = data.data;
                    if (session.analysisResult) {
                        setResultData(session.analysisResult);
                        setBirthData(session.birthData);
                        setReasoningLogs(session.reasoningLogs); // Set logs

                        // Persist back to localStorage for future speed
                        localStorage.setItem(`rectification_result_${id}`, JSON.stringify(session.analysisResult));
                        localStorage.setItem(`birthData_${id}`, JSON.stringify(session.birthData));
                        if (session.reasoningLogs) {
                            localStorage.setItem(`reasoningLogs_${id}`, JSON.stringify(session.reasoningLogs));
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch session from server:', err);
            } finally {
                setLoading(false);
            }
        };

        if (!stored || !storedBirthData) {
            fetchFromServer();
        } else {
            setLoading(false);
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F1419] flex items-center justify-center text-[#D4AF37]">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D4AF37] border-t-transparent" />
            </div>
        );
    }

    if (!resultData || !birthData) {
        return (
            <div className="min-h-screen bg-[#0F1419] flex flex-col items-center justify-center text-[#F5F0EB]">
                <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
                <p className="text-[#8C7F72] mb-8">Could not retrieve analysis data for this session.</p>
                <button
                    onClick={() => router.push(`/rectify/${id}`)}
                    className="text-[#D4AF37] hover:underline"
                >
                    Return to Analysis
                </button>
            </div>
        );
    }

    return (
        <ResultsDashboard
            sessionId={id}
            data={resultData}
            birthData={birthData}
            reasoningLogs={reasoningLogs}
        />
    );
}
