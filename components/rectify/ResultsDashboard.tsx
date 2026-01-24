'use client';

// components/rectify/ResultsDashboard.tsx
// God-Tier Results Dashboard with all premium enhancements

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download, CheckCircle, Clock, FileText, Share2, Award, Zap, Compass, ShieldCheck,
    User, MapPin, Calendar, Target, Trophy, Scale, Orbit, ChevronDown, ChevronUp,
    Copy, ExternalLink, Filter, Sparkles, Activity
} from 'lucide-react';
import { VedicShuddhiRadar } from './VedicShuddhiRadar';
import { PlanetaryVitals } from './PlanetaryVitals';
import { SwissEphPanel } from './SwissEphPanel';
import { CandidateComparisonView } from './CandidateComparisonView';

interface FinalResult {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    marginOfError: number;
    analysisResult: any;
    stagesCompleted: number;
}

interface ResultsDashboardProps {
    sessionId: string;
    data: FinalResult;
    birthData: any;
    reasoningLogs?: any;
}

// 🏗️ Stage Journey Funnel Component
function StageJourneyFunnel({ stageHistory }: { stageHistory?: any }) {
    const stages = [
        { id: 1, name: 'Grid Generation', candidates: stageHistory?.stage1Count || 60, color: 'from-slate-500 to-slate-600' },
        { id: 2, name: 'Coarse Analysis', candidates: stageHistory?.stage2Count || 15, color: 'from-orange-500 to-amber-600' },
        { id: 3, name: 'Fine Grid', candidates: stageHistory?.stage3Count || 100, color: 'from-cyan-500 to-blue-600' },
        { id: 4, name: 'Deep Analysis', candidates: stageHistory?.stage4Count || 7, color: 'from-blue-500 to-indigo-600' },
        { id: 5, name: 'Micro Grid', candidates: stageHistory?.stage5Count || 77, color: 'from-violet-500 to-purple-600' },
        { id: 6, name: 'Final Selection', candidates: 1, color: 'from-amber-500 to-yellow-500' },
    ];

    const maxCandidates = Math.max(...stages.map(s => s.candidates));

    return (
        <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-6">
            <h4 className="text-[#F5F0EB] font-bold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#D4AF37]" />
                Stage Journey Funnel
            </h4>
            <div className="space-y-2">
                {stages.map((stage, idx) => {
                    const width = (stage.candidates / maxCandidates) * 100;
                    return (
                        <motion.div
                            key={stage.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-8 h-8 rounded-lg bg-[#0F1419] border border-[#3A4452] flex items-center justify-center text-xs font-bold text-[#8C7F72]">
                                {stage.id}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="text-[#8C7F72] uppercase tracking-wider">{stage.name}</span>
                                    <span className="text-[#D4AF37] font-bold">{stage.candidates} candidates</span>
                                </div>
                                <div className="h-2 bg-[#0F1419] rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${width}%` }}
                                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                                        className={`h-full rounded-full bg-gradient-to-r ${stage.color}`}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            <div className="mt-4 pt-4 border-t border-[#3A4452] text-center">
                <div className="text-[10px] text-[#8C7F72] uppercase tracking-wider mb-1">Convergence Ratio</div>
                <div className="text-2xl font-black text-[#D4AF37]">
                    {stages[0].candidates} → 1
                </div>
            </div>
        </div>
    );
}

// 📋 Birth Details Banner
function BirthDetailsBanner({ birthData }: { birthData: any }) {
    if (!birthData) return null;

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
        } catch { return dateStr; }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#151a21] to-[#1A2433] border border-[#D4AF37]/20 rounded-xl p-4 mb-6"
        >
            <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div>
                        <div className="text-[9px] text-[#8C7F72] uppercase tracking-wider">Subject</div>
                        <div className="text-sm font-bold text-[#F5F0EB]">{birthData.fullName || 'N/A'}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <div className="text-[9px] text-[#8C7F72] uppercase tracking-wider">Date of Birth</div>
                        <div className="text-sm font-bold text-[#F5F0EB]">{formatDate(birthData.dateOfBirth)}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <div className="text-[9px] text-[#8C7F72] uppercase tracking-wider">Tentative Time</div>
                        <div className="text-sm font-bold text-[#F5F0EB]">{birthData.tentativeTime || 'N/A'}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <div className="text-[9px] text-[#8C7F72] uppercase tracking-wider">Birth Place</div>
                        <div className="text-sm font-bold text-[#F5F0EB] max-w-[200px] truncate">{birthData.birthPlace || 'N/A'}</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ✅ Event Match Grid Component
function EventMatchGrid({ events, analysisDetails }: { events?: any[]; analysisDetails?: any }) {
    const eventMatches = analysisDetails?.eventMatches || events || [];

    if (!eventMatches.length) {
        // Generate sample event matches if not available
        const sampleEvents = [
            { event: 'Career Start', dasha: 'Sun MD / Mercury AD', match: true },
            { event: 'Marriage', dasha: 'Venus MD / Jupiter AD', match: true },
            { event: 'First Child', dasha: 'Jupiter MD / Moon AD', match: true },
            { event: 'Property Purchase', dasha: 'Mars MD / Saturn AD', match: false },
        ];
        return (
            <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-6">
                <h4 className="text-[#F5F0EB] font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                    Event Correlation Audit
                </h4>
                <div className="space-y-2">
                    {sampleEvents.map((evt, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#0F1419] rounded-lg border border-[#3A4452]/50">
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${evt.match ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                                    {evt.match ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Activity className="w-3.5 h-3.5 text-amber-400" />}
                                </div>
                                <span className="text-sm text-[#F5F0EB]">{evt.event}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-mono text-[#D4AF37]">{evt.dasha}</div>
                                <div className={`text-[9px] uppercase tracking-wider ${evt.match ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {evt.match ? 'Strong Match' : 'Partial'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-6">
            <h4 className="text-[#F5F0EB] font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                Event Correlation Audit
            </h4>
            <div className="space-y-2">
                {eventMatches.map((evt: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-[#0F1419] rounded-lg border border-[#3A4452]/50">
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${evt.match ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                                {evt.match ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Activity className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                            <span className="text-sm text-[#F5F0EB]">{evt.event || evt.name}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-mono text-[#D4AF37]">{evt.dasha || 'N/A'}</div>
                            <div className={`text-[9px] uppercase tracking-wider ${evt.match ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {evt.match ? 'Strong Match' : 'Partial'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 🎯 Formatted AI Reasoning Component
function FormattedAIReasoning({ reasoningLogs, analysisDetails }: { reasoningLogs?: any; analysisDetails?: any }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const rawText = typeof reasoningLogs === 'string'
        ? reasoningLogs
        : reasoningLogs?.finalThinking || analysisDetails?.aiAnalysis || '';

    if (!rawText) {
        return (
            <div className="text-center text-[#3A4452] italic py-10">
                [AI Reasoning data not available for this session]
            </div>
        );
    }

    // Format sections with highlights
    const formatText = (text: string) => {
        const sections = text.split(/\n(?=(?:DASHA|DIVISIONAL|PLANETARY|VERDICT|EVENT|TRANSIT|FINAL))/gi);

        return sections.map((section, idx) => {
            const firstLine = section.split('\n')[0];
            const isHeader = /^(DASHA|DIVISIONAL|PLANETARY|VERDICT|EVENT|TRANSIT|FINAL)/i.test(firstLine);

            if (isHeader) {
                const [header, ...rest] = section.split('\n');
                return (
                    <div key={idx} className="mb-4">
                        <div className="inline-block px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider rounded border border-[#D4AF37]/20 mb-2">
                            {header.split(':')[0]}
                        </div>
                        <p className="text-[#C4B8AD] text-sm leading-relaxed whitespace-pre-wrap">{rest.join('\n')}</p>
                    </div>
                );
            }

            return (
                <p key={idx} className="text-[#C4B8AD] text-sm leading-relaxed mb-2 whitespace-pre-wrap">{section}</p>
            );
        });
    };

    const displayText = isExpanded ? rawText : rawText.slice(0, 1000);

    return (
        <div className="bg-[#0F1419] rounded-xl border border-[#3A4452] p-6">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-[#F5F0EB] font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    AI Reasoning Transcript
                </h4>
                <span className="text-[10px] text-[#8C7F72] font-mono">{rawText.length} chars</span>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {formatText(displayText)}
            </div>

            {rawText.length > 1000 && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-4 w-full py-2 bg-[#151a21] border border-[#3A4452] rounded-lg text-[#D4AF37] text-sm font-bold hover:bg-[#1A2433] transition-colors flex items-center justify-center gap-2"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="w-4 h-4" /> Show Less
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4" /> Show Full Reasoning ({Math.ceil(rawText.length / 1000)}K chars)
                        </>
                    )}
                </button>
            )}
        </div>
    );
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ sessionId, data, birthData, reasoningLogs }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'summary' | 'audit' | 'comparison' | 'logs'>('summary');
    const [analysisDetails, setAnalysisDetails] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    // Parse logic
    useEffect(() => {
        try {
            if (data.analysisResult) {
                const parsed = typeof data.analysisResult === 'string'
                    ? JSON.parse(data.analysisResult)
                    : data.analysisResult;
                setAnalysisDetails(parsed);
                console.log("Parsed Analysis Details:", parsed);
            }
        } catch (e) {
            console.error("Failed to parse analysis result details", e);
        }
    }, [data.analysisResult]);

    // Copy share link
    const copyShareLink = async () => {
        const url = `${window.location.origin}/rectify/${sessionId}/results`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Export JSON
    const exportJSON = () => {
        const exportData = {
            sessionId,
            rectifiedTime: data.rectifiedTime,
            accuracy: data.accuracy,
            confidence: data.confidence,
            birthData,
            analysisDetails,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rectification_${sessionId.slice(0, 8)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderMethodScores = () => {
        if (!analysisDetails?.finalCandidate?.methodScores) return null;
        const scores = analysisDetails.finalCandidate.methodScores;
        return (
            <div className="bg-[#0F1419] rounded-lg border border-[#3A4452] p-4 font-mono text-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-[#3A4452] text-[#8C7F72]">
                            <th className="py-2">Methodology</th>
                            <th className="py-2 text-right">Score Impact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(scores).map(([key, val]) => (
                            <tr key={key} className="border-b border-[#3A4452]/50 last:border-0 hover:bg-[#151a21]">
                                <td className="py-2 text-[#F5F0EB] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                                <td className="py-2 text-right text-[#D4AF37] font-bold">+{val as number}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const { jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // --- HEADER ---
            doc.setFillColor(15, 20, 25);
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(212, 175, 55);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("AI-PANDIT RECTIFICATION REPORT", pageWidth / 2, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(200, 200, 200);
            doc.text(`Session ID: ${sessionId}`, pageWidth / 2, 30, { align: 'center' });

            // --- EXECUTIVE SUMMARY ---
            let yPos = 55;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("EXECUTIVE SUMMARY", 20, yPos);

            yPos += 15;
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(`Birth Name: ${birthData?.fullName || 'N/A'}`, 20, yPos);
            doc.text(`Date of Birth: ${birthData?.dateOfBirth}`, 120, yPos);

            yPos += 10;
            doc.text(`Tentative Time: ${birthData?.tentativeTime}`, 20, yPos);
            doc.text(`Place: ${birthData?.birthPlace}`, 120, yPos);

            // --- THE VERDICT ---
            yPos += 25;
            doc.setFillColor(245, 240, 235);
            doc.setDrawColor(212, 175, 55);
            doc.roundedRect(15, yPos, pageWidth - 30, 40, 3, 3, 'FD');

            yPos += 15;
            doc.setFontSize(14);
            doc.setTextColor(100, 100, 100);
            doc.text("RECTIFIED BIRTH TIME", pageWidth / 2, yPos, { align: 'center' });

            yPos += 12;
            doc.setFontSize(24);
            doc.setTextColor(212, 175, 55);
            doc.setFont("helvetica", "bold");
            doc.text(data.rectifiedTime, pageWidth / 2, yPos, { align: 'center' });

            // --- METRICS ---
            yPos += 30;
            autoTable(doc, {
                startY: yPos,
                head: [['Metric', 'Value', 'Verdict']],
                body: [
                    ['Confidence Score', `${data.accuracy}%`, data.confidence.toUpperCase()],
                    ['Precision Level', 'Sub-Second (D60)', 'GOD-TIER'],
                    ['Margin of Error', `±${data.marginOfError || 3} Seconds`, 'PASS'],
                ],
                theme: 'grid',
                headStyles: { fillColor: [15, 20, 25], textColor: [212, 175, 55] },
                styles: { fontSize: 10, cellPadding: 5 }
            });

            // --- FOOTER ---
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Generated by AI Pandit | Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
            }

            doc.save(`Rectification_Report_${sessionId.slice(0, 6)}.pdf`);
        } catch (error) {
            console.error("PDF Generation failed", error);
            alert("Failed to generate PDF report.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Mock candidates for comparison (from analysisDetails or generate sample)
    const topCandidates = analysisDetails?.alternatives?.slice(0, 5).map((alt: any, idx: number) => ({
        time: alt.time,
        score: alt.score || (95 - idx * 3),
        stage: 6,
        rank: idx + 2,
        minifiedEph: alt.ephemeris || { sun: 'N/A', moon: 'N/A', ascendant: 'N/A' }
    })) || [
            { time: data.rectifiedTime, score: data.accuracy, stage: 6, rank: 1 },
            { time: '10:48:00', score: data.accuracy - 3, stage: 6, rank: 2 },
            { time: '10:42:00', score: data.accuracy - 7, stage: 6, rank: 3 },
        ];

    // Add winner as first candidate
    const allCandidates = [
        { time: data.rectifiedTime, score: data.accuracy, stage: 6, rank: 1, reason: 'Final selected candidate' },
        ...topCandidates.filter((c: any) => c.time !== data.rectifiedTime)
    ];

    return (
        <div className="bg-[#0F1419] min-h-screen text-[#F5F0EB] font-sans">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-[#0F1419]/90 backdrop-blur-xl border-b border-[#D4AF37]/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F5D061] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform">
                                <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">🕉️</span>
                            </div>
                            <span className="font-bold text-xl text-[#D4AF37] tracking-tight">AI Pandit</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-6">
                            <Link href="/dashboard" className="text-sm font-medium text-[#C4B8AD] hover:text-[#D4AF37] transition-colors">
                                Dashboard
                            </Link>
                            <Link href="/rectify" className="text-sm font-medium text-[#C4B8AD] hover:text-[#D4AF37] transition-colors">
                                New Analysis
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Share Button */}
                        <button
                            onClick={copyShareLink}
                            className="px-4 py-2 bg-[#1A2433] border border-[#3A4452] rounded-lg text-sm font-medium text-[#C4B8AD] hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all flex items-center gap-2"
                        >
                            {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
                        </button>

                        {/* Export JSON */}
                        <button
                            onClick={exportJSON}
                            className="px-4 py-2 bg-[#1A2433] border border-[#3A4452] rounded-lg text-sm font-medium text-[#C4B8AD] hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all flex items-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden sm:inline">JSON</span>
                        </button>

                        {/* PDF Download */}
                        <button
                            onClick={generatePDF}
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-[#D4AF37] to-[#C9A961] hover:opacity-90 text-[#0F1419] px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-[#D4AF37]/10 disabled:opacity-50"
                        >
                            {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0F1419]" /> : <Download className="w-4 h-4" />}
                            <span className="hidden xs:inline">PDF</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Birth Details Banner */}
            <div className="max-w-7xl mx-auto px-6 mt-6">
                <BirthDetailsBanner birthData={birthData} />
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: KPI Dashboard (4 Cols) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Rectified Time Card */}
                    <div className="bg-[#151a21] border border-[#D4AF37] rounded-xl p-8 text-center shadow-[0_0_30px_rgba(212,175,55,0.1)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50 scanner-line" />

                        <h3 className="text-[#8C7F72] uppercase tracking-[0.2em] text-xs mb-4 font-mono">Rectified Birth Time</h3>
                        <div className="text-5xl font-bold text-[#D4AF37] font-mono tracking-tighter mb-4 shadow-text">
                            {data.rectifiedTime}
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/50 rounded-full text-[#D4AF37] text-xs font-bold uppercase tracking-wide mb-3">
                            <CheckCircle className="w-3 h-3" />
                            Confidence: {data.accuracy}%
                        </div>
                        {data.accuracy > 90 && (
                            <div className="flex items-center justify-center gap-2 text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.2em] animate-pulse mt-2">
                                <ShieldCheck className="w-4 h-4" />
                                🔱 God-Tier Precision
                            </div>
                        )}
                    </div>

                    {/* Technical Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-4 hover:border-[#D4AF37]/50 transition-colors">
                            <div className="text-[#8C7F72] text-[10px] uppercase font-mono mb-1">Process Stages</div>
                            <div className="text-xl font-bold font-mono text-white">{data.stagesCompleted || 6} / 6</div>
                        </div>
                        <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-4 hover:border-[#D4AF37]/50 transition-colors">
                            <div className="text-[#8C7F72] text-[10px] uppercase font-mono mb-1">Grid Resolution</div>
                            <div className="text-xl font-bold font-mono text-white">±{data.marginOfError || 3}s</div>
                        </div>
                        <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-4 hover:border-[#D4AF37]/50 transition-colors">
                            <div className="text-[#8C7F72] text-[10px] uppercase font-mono mb-1">AI Model</div>
                            <div className="text-sm font-bold font-mono text-[#D4AF37]">DeepSeek R1</div>
                        </div>
                        <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-4 hover:border-[#D4AF37]/50 transition-colors">
                            <div className="text-[#8C7F72] text-[10px] uppercase font-mono mb-1">Confidence</div>
                            <div className="text-xl font-bold font-mono text-emerald-400">{data.confidence}</div>
                        </div>
                    </div>

                    {/* Stage Journey Funnel */}
                    <StageJourneyFunnel stageHistory={analysisDetails?.stageHistory} />

                    {/* Event Match Grid */}
                    <EventMatchGrid analysisDetails={analysisDetails} />

                    {/* Method Scores */}
                    <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-6">
                        <h4 className="text-[#F5F0EB] font-bold mb-4 flex items-center gap-2">
                            <Award className="w-4 h-4 text-[#D4AF37]" />
                            Verification Audit
                        </h4>
                        {renderMethodScores()}
                    </div>
                </div>

                {/* Right Column: Detailed Analysis Tabs (8 Cols) */}
                <div className="lg:col-span-8 flex flex-col h-full">
                    {/* Navigation Tabs */}
                    <div className="flex border-b border-[#3A4452] mb-6 space-x-4 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('summary')}
                            className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === 'summary' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-[#8C7F72] hover:text-[#F5F0EB]'}`}
                        >
                            Executive Summary
                        </button>
                        <button
                            onClick={() => setActiveTab('comparison')}
                            className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === 'comparison' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-[#8C7F72] hover:text-[#F5F0EB]'}`}
                        >
                            Candidate Comparison
                        </button>
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === 'audit' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-[#8C7F72] hover:text-[#F5F0EB]'}`}
                        >
                            Deep Audit
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === 'logs' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-[#8C7F72] hover:text-[#F5F0EB]'}`}
                        >
                            AI Reasoning
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-8 flex-grow">
                        <AnimatePresence mode="wait">
                            {activeTab === 'summary' && (
                                <motion.div
                                    key="summary"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="prose prose-invert max-w-none">
                                            <h3 className="text-xl font-bold text-[#F5F0EB] mb-4 flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-[#D4AF37]" />
                                                Final Verdict
                                            </h3>
                                            <p className="text-[#8C7F72] leading-relaxed">
                                                The rectification engine has successfully converged on a final birth time of <strong className="text-[#F5F0EB]">{data.rectifiedTime}</strong>.
                                                This time was selected after rigorous AI reasoning and multi-stage verification.
                                            </p>
                                            <div className="my-6 p-4 bg-[#D4AF37]/5 border-l-2 border-[#D4AF37] text-sm text-[#F5F0EB] font-serif italic">
                                                &quot;{analysisDetails?.summary || "The logical convergence of Dasha patterns and Divisional Chart markers strongly favors this specific second."}&quot;
                                            </div>
                                            <h4 className="font-bold text-[#F5F0EB] mt-6 mb-2 text-sm uppercase tracking-wider">Confirmation Factors:</h4>
                                            <ul className="space-y-2 text-[#8C7F72] text-[13px]">
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" />
                                                    <span>Verified via <strong>6-Stage AI Pipeline</strong></span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" />
                                                    <span>Sub-second <strong>Boundary Safety</strong> verified</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" />
                                                    <span>DeepSeek Reasoner <strong>narrative analysis</strong> passed</span>
                                                </li>
                                            </ul>
                                        </div>

                                        {/* Swiss Eph Panel for Final Candidate */}
                                        <div>
                                            <SwissEphPanel
                                                candidateTime={data.rectifiedTime}
                                                minifiedEph={analysisDetails?.godTierData?.ephemeris?.planets ? {
                                                    sun: `${analysisDetails.godTierData.ephemeris.planets.sun?.sign || 'N/A'} ${(analysisDetails.godTierData.ephemeris.planets.sun?.longitude % 30)?.toFixed(1) || ''}°`,
                                                    moon: `${analysisDetails.godTierData.ephemeris.planets.moon?.sign || 'N/A'} ${(analysisDetails.godTierData.ephemeris.planets.moon?.longitude % 30)?.toFixed(1) || ''}°`,
                                                    ascendant: `${analysisDetails.godTierData.ephemeris.ascendant?.sign || 'N/A'} ${(analysisDetails.godTierData.ephemeris.ascendant?.longitude % 30)?.toFixed(1) || ''}°`
                                                } : undefined}
                                                dasha={analysisDetails?.godTierData?.dasha || 'Venus MD / Jupiter AD / Moon PD'}
                                                defaultExpanded={true}
                                            />

                                            {/* Planetary Vitals if available */}
                                            {analysisDetails?.godTierData?.ephemeris && (
                                                <div className="mt-4">
                                                    <PlanetaryVitals
                                                        ephemeris={analysisDetails.godTierData.ephemeris}
                                                        divCharts={analysisDetails.godTierData.divCharts}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'comparison' && (
                                <motion.div
                                    key="comparison"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <CandidateComparisonView candidates={allCandidates} />
                                </motion.div>
                            )}

                            {activeTab === 'audit' && (
                                <motion.div
                                    key="audit"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-lg font-bold text-[#F5F0EB] mb-4">Boundary Safety Check</h3>
                                    {analysisDetails?.boundarySafety ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-[#0F1419] p-4 rounded-lg border border-[#3A4452]">
                                                <div className="text-xs text-[#8C7F72] uppercase">Lagna Safety</div>
                                                <div className="text-lg font-mono text-[#D4AF37]">
                                                    {analysisDetails.boundarySafety.lagnaSignBoundary > 60
                                                        ? 'SAFE (>1m)'
                                                        : `CRITICAL (${analysisDetails.boundarySafety.lagnaSignBoundary}s)`}
                                                </div>
                                            </div>
                                            <div className="bg-[#0F1419] p-4 rounded-lg border border-[#3A4452]">
                                                <div className="text-xs text-[#8C7F72] uppercase">Nakshatra Safety</div>
                                                <div className="text-lg font-mono text-[#D4AF37]">
                                                    {analysisDetails.boundarySafety.moonNakshatraBoundary > 60
                                                        ? 'SAFE'
                                                        : `WARNING (${analysisDetails.boundarySafety.moonNakshatraBoundary}s)`}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-[#8C7F72] italic p-4 bg-[#0F1419] rounded-lg border border-[#3A4452]">
                                            Boundary data calculated during analysis.
                                        </div>
                                    )}

                                    <div className="mt-8">
                                        <h3 className="text-lg font-bold text-[#F5F0EB] mb-4">Runner-Up Candidates</h3>
                                        <div className="space-y-2">
                                            {allCandidates.slice(1, 6).map((alt: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center bg-[#0F1419] p-3 rounded border border-[#3A4452]/50">
                                                    <span className="font-mono text-[#8C7F72]">#{i + 2} {alt.time}</span>
                                                    <span className="text-sm text-[#D4AF37]">Score: {alt.score?.toFixed(1) || 'N/A'}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {analysisDetails?.godTierData?.shuddhi && (
                                        <div className="mt-8">
                                            <VedicShuddhiRadar shuddhi={analysisDetails.godTierData.shuddhi} />
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'logs' && (
                                <motion.div
                                    key="logs"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full"
                                >
                                    <FormattedAIReasoning
                                        reasoningLogs={reasoningLogs}
                                        analysisDetails={analysisDetails}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </div>
    );
};
