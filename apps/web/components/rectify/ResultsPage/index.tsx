'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { ResultsPageProps } from './types';
import { useResultsPage } from './hooks/useResultsPage';
import { ResultsPageErrorBoundary } from './components/ErrorBoundary';
import { TopRecommendation } from './components/TopRecommendation';
import { AlternativeOptions } from './components/AlternativeOptions';
import { ComputeStatistics } from './components/ComputeStatistics';

function ResultsPageContent({ analysisData, onNewAnalysis }: ResultsPageProps) {
    const engine = useResultsPage(onNewAnalysis);

    const {
        rectifiedTime = 'Unknown',
        accuracy = 0,
        confidence = 'Medium',
        topRecommendation,
        alternativeOptions = [],
        statistics,
    } = analysisData || {};

    if (!analysisData || !topRecommendation) {
        return (
            <div className="max-w-4xl mx-auto p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-[#1A1612] mb-2">Invalid Data</h2>
                <p className="text-[#7A756F] mb-4">The analysis data is incomplete or corrupted.</p>
                <button
                    onClick={engine.handleNewAnalysis}
                    className="px-6 py-3 bg-[#78611D] text-white rounded-lg font-bold"
                >
                    Start New Analysis
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 text-[#1A1612]">
            <TopRecommendation
                rectifiedTime={rectifiedTime}
                accuracy={accuracy}
                confidence={confidence}
                topRecommendation={topRecommendation}
                extractSection={engine.extractSection}
            />

            {/* Tabs Menu */}
            <div className="border-b border-[#F0E8DE]">
                <div className="flex gap-8" role="tablist">
                    {(['top', 'alternatives', 'all'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => engine.setSelectedTab(tab)}
                            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${engine.selectedTab === tab
                                ? 'text-[#78611D] border-b-2 border-[#78611D]'
                                : 'text-[#7A756F] hover:text-[#1A1612]'
                                }`}
                            role="tab"
                            aria-selected={engine.selectedTab === tab}
                        >
                            {tab === 'top' && 'Finalist'}
                            {tab === 'alternatives' && `Alternatives (${alternativeOptions.length})`}
                            {tab === 'all' && `Compute Grid (${statistics?.allCandidateScores?.length || 0})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Payload */}
            <AnimatePresence mode="wait">
                {engine.selectedTab === 'top' && (
                    <motion.div
                        key="top"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white border border-[#F0E8DE] rounded-xl p-8 space-y-6"
                        role="tabpanel"
                    >
                        <h2 className="text-xl font-black text-[#1A1612] uppercase tracking-tight">
                            Primary Candidate Analysis
                        </h2>
                        <TopRecommendation
                            rectifiedTime={rectifiedTime}
                            accuracy={accuracy}
                            confidence={confidence}
                            topRecommendation={topRecommendation}
                            extractSection={engine.extractSection}
                        />
                    </motion.div>
                )}

                {engine.selectedTab === 'alternatives' && (
                    <motion.div
                        key="alternatives"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                        role="tabpanel"
                    >
                        <AlternativeOptions alternativeOptions={alternativeOptions} />
                    </motion.div>
                )}

                {engine.selectedTab === 'all' && statistics && (
                    <motion.div
                        key="all"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                        role="tabpanel"
                    >
                        <ComputeStatistics statistics={statistics} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reset Engine Action */}
            <div className="text-center pt-8">
                <button
                    onClick={engine.handleNewAnalysis}
                    disabled={engine.isLoading}
                    className="px-10 py-4 bg-gradient-to-r from-[#78611D] to-[#C9A961] text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-[0_10px_30px_rgba(212,175,55,0.2)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.3)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {engine.isLoading ? 'Loading...' : 'Initialize New Matrix'}
                </button>
            </div>
        </div>
    );
}

export default function ResultsPageIndex(props: ResultsPageProps) {
    return (
        <ResultsPageErrorBoundary>
            <ResultsPageContent {...props} />
        </ResultsPageErrorBoundary>
    );
}
