'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ResultsDashboard } from '@/components/rectify/ResultsDashboard';
import Layout from '@/components/Layout';
import Link from 'next/link';

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

        // 2. Fetch from API if not in local storage or if local storage is just skeletal (no analysisResult)
        const fetchFromServer = async () => {
            try {
                console.log('📡 [Results] Local data missing or skeletal. Hydrating from API...');
                const res = await fetch(`/api/sessions/${id}`);
                const data = await res.json();

                if (data.success && data.data) {
                    const session = data.data;
                    if (session.analysisResult) {
                        try {
                            const parsedDetails = typeof session.analysisResult === 'string'
                                ? JSON.parse(session.analysisResult)
                                : session.analysisResult;

                            setResultData({
                                ...session,
                                analysisResult: session.analysisResult
                            });
                        } catch (e) {
                            setResultData(session);
                        }

                        setBirthData(session.birthData);
                        setReasoningLogs(session.reasoningLogs);

                        // Persist back to localStorage for future speed
                        localStorage.setItem(`rectification_result_${id}`, JSON.stringify({
                            ...session,
                            analysisResult: session.analysisResult
                        }));
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

        const isSkeletal = stored && !JSON.parse(stored).analysisResult;

        if (!stored || !storedBirthData || isSkeletal) {
            fetchFromServer();
        } else {
            setLoading(false);
        }
    }, [id]);

    if (loading) {
        return (
            <Layout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D4AF37] border-t-transparent mx-auto mb-4" />
                        <p className="text-[#8C7F72]">Loading results...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!resultData || !birthData) {
        return (
            <Layout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                    <div className="w-20 h-20 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-6">
                        <span className="text-4xl">⚠️</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#F5F0EB] mb-4">No Results Found</h1>
                    <p className="text-[#8C7F72] mb-8 max-w-md">Could not retrieve analysis data for this session. The analysis may still be in progress.</p>
                    <div className="flex gap-4">
                        <Link
                            href={`/rectify/${id}`}
                            className="px-6 py-3 bg-[#1A1F2E] border border-[#2A3442] text-[#F5F0EB] rounded-xl hover:border-[#D4AF37]/50 transition-colors"
                        >
                            Check Progress
                        </Link>
                        <Link
                            href="/dashboard"
                            className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <ResultsDashboard
                sessionId={id}
                data={resultData}
                birthData={birthData}
                reasoningLogs={reasoningLogs}
            />
        </Layout>
    );
}
