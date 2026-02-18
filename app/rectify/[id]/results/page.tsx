'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { ResultsDashboard } from '@/components/rectify/ResultsDashboard';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { Breadcrumbs, predefinedBreadcrumbs } from '@/components/ui/Breadcrumbs';

export default function ResultsPage() {
    const params = useParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const id = params.id as string;

    const [resultData, setResultData] = useState<any>(null);
    const [birthData, setBirthData] = useState<any>(null);
    const [reasoningLogs, setReasoningLogs] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchResults = async () => {
            try {
                // 1. Try localStorage first for speed
                const stored = localStorage.getItem(`rectification_result_${id}`);
                const storedBirthData = localStorage.getItem(`birthData_${id}`);
                const storedLogs = localStorage.getItem(`reasoningLogs_${id}`);

                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        setResultData(parsed);
                        if (parsed.birthData) setBirthData(parsed.birthData);
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

                // 2. Fetch from Vercel API (same Turso DB) - Hybrid Architecture
                const token = await getToken();
                const res = await fetch(`/api/sessions/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) {
                    if (res.status === 401) {
                        setError('Please sign in to view results');
                    } else if (res.status === 404) {
                        setError('Session not found');
                    } else {
                        setError('Failed to load results');
                    }
                    setLoading(false);
                    return;
                }

                const data = await res.json();

                if (data.success && data.data) {
                    const session = data.data;

                    // Parse analysis result if it's a string
                    let analysisResult = session.analysisResult;
                    if (typeof analysisResult === 'string') {
                        try {
                            analysisResult = JSON.parse(analysisResult);
                        } catch (e) {
                            // Keep as string if not JSON
                        }
                    }

                    setResultData({
                        ...session,
                        analysisResult,
                        rectifiedTime: session.rectifiedTime || analysisResult?.rectifiedTime,
                        accuracy: session.accuracy || analysisResult?.accuracy,
                        confidence: session.confidence || analysisResult?.confidence,
                    });

                    setBirthData(session.birthData);
                    setReasoningLogs(session.reasoningLogs);

                    // Persist to localStorage for future speed
                    if (session.rectifiedTime || analysisResult?.rectifiedTime) {
                        localStorage.setItem(`rectification_result_${id}`, JSON.stringify({
                            ...session,
                            analysisResult,
                        }));
                        if (session.birthData) {
                            localStorage.setItem(`birthData_${id}`, JSON.stringify(session.birthData));
                        }
                        if (session.reasoningLogs) {
                            localStorage.setItem(`reasoningLogs_${id}`, JSON.stringify(session.reasoningLogs));
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch session:', err);
                setError('Failed to load results');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [id, getToken]);

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

    if (error) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-6 pt-6">
                    <Breadcrumbs items={predefinedBreadcrumbs.results(id)} className="mb-6" />
                </div>
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                    <div className="w-20 h-20 rounded-full bg-[#C65D3B]/10 flex items-center justify-center mb-6">
                        <span className="text-4xl">⚠️</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1A1612] mb-4 font-[family-name:var(--font-cormorant)]">Error Loading Results</h1>
                    <p className="text-[#7A756F] mb-8 max-w-md">{error}</p>
                    <div className="flex gap-4">
                        <Link
                            href={`/rectify/${id}`}
                            className="px-6 py-3 bg-white border border-[#F0E8DE] text-[#1A1612] rounded-xl hover:border-[#D4A853]/50 transition-colors"
                        >
                            Check Progress
                        </Link>
                        <Link
                            href="/dashboard"
                            className="px-6 py-3 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!resultData || !birthData) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-6 pt-6">
                    <Breadcrumbs items={predefinedBreadcrumbs.results(id)} className="mb-6" />
                </div>
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                    <div className="w-20 h-20 rounded-full bg-[#B8860B]/10 flex items-center justify-center mb-6">
                        <span className="text-4xl">🔍</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1A1612] mb-4 font-[family-name:var(--font-cormorant)]">No Results Found</h1>
                    <p className="text-[#7A756F] mb-8 max-w-md">The analysis may still be in progress or has not completed yet.</p>
                    <div className="flex gap-4">
                        <Link
                            href={`/rectify/${id}`}
                            className="px-6 py-3 bg-white border border-[#F0E8DE] text-[#1A1612] rounded-xl hover:border-[#D4A853]/50 transition-colors"
                        >
                            Check Progress
                        </Link>
                        <Link
                            href="/dashboard"
                            className="px-6 py-3 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
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
