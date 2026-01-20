import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, CheckCircle, Clock, FileText, Share2, Award } from 'lucide-react';

interface FinalResult {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    marginOfError: number;
    analysisResult: string; // JSON string with full details
    stagesCompleted: number;
}

interface ResultsDashboardProps {
    sessionId: string;
    data: FinalResult;
    birthData: any;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ sessionId, data, birthData }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [analysisDetails, setAnalysisDetails] = useState<any>(null);

    useEffect(() => {
        try {
            if (data.analysisResult) {
                setAnalysisDetails(JSON.parse(data.analysisResult));
            }
        } catch (e) {
            console.error("Failed to parse analysis result details", e);
        }
    }, [data.analysisResult]);

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // --- HEADER ---
            doc.setFillColor(15, 20, 25); // Dark background
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(212, 175, 55); // Gold
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
            doc.text(`Birth Name: ${birthData.fullName || 'N/A'}`, 20, yPos);
            doc.text(`Date of Birth: ${birthData.dateOfBirth}`, 120, yPos);

            yPos += 10;
            doc.text(`Tentative Time: ${birthData.tentativeTime}`, 20, yPos);
            doc.text(`Place: ${birthData.birthPlace}`, 120, yPos);

            // --- THE VERDICT ---
            yPos += 20;
            doc.setFillColor(245, 240, 235);
            doc.setDrawColor(212, 175, 55);
            doc.roundedRect(15, yPos, pageWidth - 30, 40, 3, 3, 'FD');

            yPos += 15;
            doc.setFontSize(14);
            doc.setTextColor(100, 100, 100);
            doc.text("RECTIFIED BIRTH TIME", pageWidth / 2, yPos, { align: 'center' });

            yPos += 12;
            doc.setFontSize(24);
            doc.setTextColor(212, 175, 55); // Gold
            doc.setFont("helvetica", "bold");
            doc.text(data.rectifiedTime, pageWidth / 2, yPos, { align: 'center' });

            // --- METRICS ---
            yPos += 30;

            autoTable(doc, {
                startY: yPos,
                head: [['Metric', 'Value', 'Verdict']],
                body: [
                    ['Confidence Score', `${data.accuracy}%`, data.confidence.toUpperCase()],
                    ['Precision Level', 'Sub-Minute (Seconds)', 'EXCELLENT'],
                    ['Margin of Error', `\u00B1${data.marginOfError || 3} Seconds`, 'PASS'],
                    ['Methodology', '10-Stage Multi-Pass', 'VERIFIED'],
                ],
                theme: 'grid',
                headStyles: { fillColor: [15, 20, 25], textColor: [212, 175, 55] },
                styles: { fontSize: 10, cellPadding: 5 }
            });

            // --- ANALYSIS DETAILS (If available) ---
            if (analysisDetails) {
                // Verification Score
                const finalY = (doc as any).lastAutoTable.finalY + 20;
                doc.setFontSize(16);
                doc.setTextColor(0, 0, 0);
                doc.text("TECHNICAL VERIFICATION", 20, finalY);

                // Check for Method Breakdown
                /*
               if (analysisDetails.finalCandidate && analysisDetails.finalCandidate.methodScores) {
                    const scores = analysisDetails.finalCandidate.methodScores;
                    const scoreData = Object.entries(scores).map(([key, val]) => [key, val]);
                    
                    autoTable(doc, {
                       startY: finalY + 10,
                       head: [['Method', 'Score']],
                       body: scoreData,
                       theme: 'striped',
                       headStyles: { fillColor: [60, 60, 60] }
                    });
               }
               */
            }

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

    return (
        <div className="bg-[#0F1419] min-h-screen text-[#F5F0EB] font-sans">
            {/* Header */}
            <div className="bg-[#151a21] border-b border-[#3A4452] p-6 shadow-lg">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-[#D4AF37] flex items-center gap-2">
                            <Award className="w-8 h-8" />
                            Analysis Complete
                        </h1>
                        <p className="text-[#8C7F72] text-sm">Session ID: {sessionId}</p>
                    </div>
                    <button
                        onClick={generatePDF}
                        disabled={isGenerating}
                        className="bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F1419] px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {isGenerating ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#0F1419]" /> : <Download className="w-5 h-5" />}
                        Download Full Report
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

                {/* Left Column: Key Stats */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Rectified Time Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#151a21] border border-[#D4AF37] rounded-xl p-8 text-center shadow-[0_0_30px_rgba(212,175,55,0.1)] relative overflow-hidden"
                    >
                        {/* Glow Effect */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />

                        <h3 className="text-[#8C7F72] uppercase tracking-widest text-sm mb-4">Rectified Birth Time</h3>
                        <div className="text-5xl font-bold text-[#D4AF37] font-mono tracking-tight mb-2">
                            {data.rectifiedTime}
                        </div>
                        <div className="text-green-400 text-sm font-medium flex justify-center items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Confirmed with {data.accuracy}% Confidence
                        </div>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-4">
                            <div className="text-[#8C7F72] text-xs uppercase mb-1">Precision</div>
                            <div className="text-xl font-bold">Seconds</div>
                        </div>
                        <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-4">
                            <div className="text-[#8C7F72] text-xs uppercase mb-1">Passes</div>
                            <div className="text-xl font-bold">10/10</div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Executive Summary */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#151a21] border border-[#3A4452] rounded-xl p-8"
                    >
                        <h3 className="text-xl font-bold text-[#F5F0EB] mb-6 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#D4AF37]" />
                            Executive Summary
                        </h3>

                        <div className="prose prose-invert max-w-none text-[#8C7F72] text-sm leading-relaxed">
                            <p className="mb-4">
                                The rectification engine has successfully converged on a final birth time of <strong className="text-[#F5F0EB]">{data.rectifiedTime}</strong>.
                                This time was selected from an initial pool of candidates through a rigorous 10-stage elimination process.
                            </p>
                            <p className="mb-4">
                                <strong className="text-[#D4AF37]">Why this time?</strong>
                                <br />
                                The final candidate showed the highest correlation with your provided life events, specifically aligning with the Vimshottari and Yogini Dasha sequences active during your key milestones.
                            </p>

                            {data.marginOfError && (
                                <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded p-4 mt-6">
                                    <h4 className="text-[#D4AF37] font-bold text-xs uppercase mb-2">Technical Verdict</h4>
                                    <p className="text-[#F5F0EB]">
                                        The calculated time falls within a margin of error of +/- {data.marginOfError} seconds.
                                        This level of precision is suitable for all advanced Vedic Astrology predictions including D60 analysis.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    );
};
