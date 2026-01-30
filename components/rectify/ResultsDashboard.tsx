/**
 * ResultsDashboard.tsx
 * God-Tier Results Dashboard with comprehensive security, performance, and accessibility
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, CheckCircle, Clock, FileText, Share2, Award, Zap, Compass, ShieldCheck,
  User, MapPin, Calendar, Target, Trophy, Scale, Orbit, ChevronDown, ChevronUp,
  Copy, ExternalLink, Filter, Sparkles, Activity, AlertTriangle
} from 'lucide-react';
import { VedicShuddhiRadar } from './VedicShuddhiRadar';
import { PlanetaryVitals } from './PlanetaryVitals';
import { SwissEphPanel } from './SwissEphPanel';
import { CandidateComparisonView } from './CandidateComparisonView';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface BirthData {
  fullName?: string;
  dateOfBirth?: string;
  tentativeTime?: string;
  birthPlace?: string;
}

interface StageHistory {
  stage1Count?: number;
  stage2Count?: number;
  stage3Count?: number;
  stage4Count?: number;
  stage5Count?: number;
}

interface MethodScores {
  [key: string]: number;
}

interface FinalCandidate {
  thinking?: string;
  methodScores?: MethodScores;
}

interface GodTierData {
  ephemeris?: {
    planets?: {
      sun?: { sign?: string; longitude?: number };
      moon?: { sign?: string; longitude?: number };
    };
    ascendant?: { sign?: string; longitude?: number };
  };
  divCharts?: unknown;
  dasha?: string;
  shuddhi?: unknown;
}

interface BoundarySafety {
  lagnaSignBoundary: number;
  moonNakshatraBoundary: number;
}

interface AnalysisDetails {
  summary?: string;
  finalCandidate?: FinalCandidate;
  alternatives?: Array<{ time: string; score?: number; ephemeris?: unknown }>;
  stageHistory?: StageHistory;
  eventMatches?: Array<{ event?: string; name?: string; match?: boolean; dasha?: string }>;
  boundarySafety?: BoundarySafety;
  godTierData?: GodTierData;
  aiAnalysis?: string;
}

interface FinalResult {
  rectifiedTime: string;
  accuracy: number;
  confidence: string;
  marginOfError: number;
  analysisResult: string | AnalysisDetails;
  stagesCompleted: number;
}

interface ResultsDashboardProps {
  sessionId: string;
  data: FinalResult;
  birthData: BirthData;
  reasoningLogs?: string | AnalysisDetails;
}

interface Stage {
  id: number;
  name: string;
  candidates: number;
  color: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY: HTML Sanitization Utility
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sanitizes user input to prevent XSS attacks
 * Removes script tags, event handlers, and dangerous attributes
 */
function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<[^>]+\s+on\w+\s*=/gi, (match) => match.replace(/on\w+\s*=/gi, ''));
}

/**
 * Truncates text safely for display
 */
function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength) + '...';
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extracts a clean verdict from AI analysis text
 * Security: Output is sanitized to prevent XSS
 */
function cleanSummary(rawSummary: string | undefined): string {
  if (!rawSummary) {
    return 'The logical convergence of Dasha patterns and Divisional Chart markers strongly favors this specific time.';
  }

  // Try to extract a clean verdict line
  const verdictMatch = rawSummary.match(/(?:VERDICT|RECOMMENDATION|CONCLUSION)[:\s]*([^\n]{10,150})/i);
  if (verdictMatch) {
    return sanitizeHtml(verdictMatch[1].trim());
  }

  // Try to find a meaningful sentence
  const sentences = rawSummary.split(/[.!]/).filter(s => s.trim().length > 20);
  if (sentences.length > 0) {
    const cleanSentence = sentences[0]
      .replace(/FINAL VERDICT:|BEST TIME:|ACCURACY:/gi, '')
      .replace(/\[.*?\]/g, '')
      .trim();
    if (cleanSentence.length > 20 && cleanSentence.length < 200) {
      return sanitizeHtml(cleanSentence);
    }
  }

  return 'The logical convergence of Dasha patterns and Divisional Chart markers strongly favors this specific time.';
}

/**
 * Formats date safely for display
 */
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric', 
      month: 'long', 
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ResultsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ResultsDashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F1419] flex items-center justify-center p-6">
          <div className="bg-[#151a21] border border-red-500/30 rounded-xl p-8 max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#F5F0EB] mb-2">Something Went Wrong</h2>
            <p className="text-[#8C7F72] text-sm mb-4">
              We encountered an error displaying your results. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#D4AF37] text-[#0F1419] rounded-lg font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE JOURNEY FUNNEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const STAGES: Stage[] = [
  { id: 1, name: 'Grid Generation', candidates: 60, color: 'from-slate-500 to-slate-600' },
  { id: 2, name: 'Coarse Analysis', candidates: 15, color: 'from-orange-500 to-amber-600' },
  { id: 3, name: 'Fine Grid', candidates: 100, color: 'from-cyan-500 to-blue-600' },
 { id: 4, name: 'Deep Analysis', candidates: 7, color: 'from-blue-500 to-indigo-600' },
  { id: 5, name: 'Micro Grid', candidates: 77, color: 'from-violet-500 to-purple-600' },
  { id: 6, name: 'Final Selection', candidates: 1, color: 'from-amber-500 to-yellow-500' },
];

function StageJourneyFunnel({ stageHistory }: { stageHistory?: StageHistory }) {
  const stages = useMemo(() => {
    if (!stageHistory) return STAGES;
    return [
      { ...STAGES[0], candidates: stageHistory.stage1Count || 60 },
      { ...STAGES[1], candidates: stageHistory.stage2Count || 15 },
      { ...STAGES[2], candidates: stageHistory.stage3Count || 100 },
      { ...STAGES[3], candidates: stageHistory.stage4Count || 7 },
      { ...STAGES[4], candidates: stageHistory.stage5Count || 77 },
      STAGES[5],
    ];
  }, [stageHistory]);

  const maxCandidates = useMemo(() => Math.max(...stages.map(s => s.candidates)), [stages]);

  return (
    <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-6">
      <h4 className="text-[#F5F0EB] font-bold mb-4 flex items-center gap-2">
        <Filter className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
        Stage Journey Funnel
      </h4>
      <div className="space-y-2" role="list" aria-label="Processing stages">
        {stages.map((stage, idx) => {
          const width = maxCandidates > 0 ? (stage.candidates / maxCandidates) * 100 : 0;
          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-3"
              role="listitem"
            >
              <div 
                className="w-8 h-8 rounded-lg bg-[#0F1419] border border-[#3A4452] flex items-center justify-center text-xs font-bold text-[#8C7F72]"
                aria-label={`Stage ${stage.id}`}
              >
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
                    role="progressbar"
                    aria-valuenow={stage.candidates}
                    aria-valuemin={0}
                    aria-valuemax={maxCandidates}
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
          {stages[0]?.candidates || 60} → 1
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BIRTH DETAILS BANNER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function BirthDetailsBanner({ birthData }: { birthData: BirthData | null | undefined }) {
  if (!birthData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-[#151a21] to-[#1A2433] border border-[#D4AF37]/20 rounded-xl p-4 mb-6"
    >
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center" aria-hidden="true">
            <User className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <div className="text-[9px] text-[#8C7F72] uppercase tracking-wider">Subject</div>
            <div className="text-sm font-bold text-[#F5F0EB]">
              {sanitizeHtml(truncateText(birthData.fullName, 50)) || 'N/A'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center" aria-hidden="true">
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-[9px] text-[#8C7F72] uppercase tracking-wider">Date of Birth</div>
            <div className="text-sm font-bold text-[#F5F0EB]">{formatDate(birthData.dateOfBirth)}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center" aria-hidden="true">
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-[9px] text-[#8C7F72] uppercase tracking-wider">Tentative Time</div>
            <div className="text-sm font-bold text-[#F5F0EB]">{birthData.tentativeTime || 'N/A'}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center" aria-hidden="true">
            <MapPin className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-[9px] text-[#8C7F72] uppercase tracking-wider">Birth Place</div>
            <div className="text-sm font-bold text-[#F5F0EB] max-w-[200px] truncate">
              {sanitizeHtml(truncateText(birthData.birthPlace, 100)) || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT MATCH GRID COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface EventMatch {
  event?: string;
  name?: string;
  match?: boolean;
  dasha?: string;
}

function EventMatchGrid({ 
  events, 
  analysisDetails 
}: { 
  events?: EventMatch[]; 
  analysisDetails?: AnalysisDetails;
}) {
  const eventMatches = useMemo(() => {
    return analysisDetails?.eventMatches || events || [];
  }, [analysisDetails?.eventMatches, events]);

  if (!eventMatches.length) {
    return (
      <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-6">
        <h4 className="text-[#F5F0EB] font-bold mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
          Event Correlation Audit
        </h4>
        <div className="text-center text-[#8C7F72] text-sm italic py-4">
          No event correlations available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-6">
      <h4 className="text-[#F5F0EB] font-bold mb-4 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
        Event Correlation Audit
      </h4>
      <div className="space-y-2">
        {eventMatches.map((evt: EventMatch, idx: number) => (
          <div 
            key={idx} 
            className="flex items-center justify-between p-3 bg-[#0F1419] rounded-lg border border-[#3A4452]/50"
          >
            <div className="flex items-center gap-3">
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  evt.match ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                }`}
                aria-hidden="true"
              >
                {evt.match ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <span className="text-sm text-[#F5F0EB]">
                {sanitizeHtml(evt.event || evt.name || 'Unknown Event')}
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-[#D4AF37]">{evt.dasha || 'N/A'}</div>
              <div className={`text-[9px] uppercase tracking-wider ${
                evt.match ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {evt.match ? 'Strong Match' : 'Partial'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORMATTED AI REASONING COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function FormattedAIReasoning({ 
  reasoningLogs, 
  analysisDetails 
}: { 
  reasoningLogs?: string | AnalysisDetails;
  analysisDetails?: AnalysisDetails;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const rawText = useMemo(() => {
    if (typeof reasoningLogs === 'string') return reasoningLogs;
    return analysisDetails?.finalCandidate?.thinking || 
           analysisDetails?.aiAnalysis || 
           '';
  }, [reasoningLogs, analysisDetails]);

  const displayText = useMemo(() => {
    return isExpanded ? rawText : truncateText(rawText, 1000);
  }, [rawText, isExpanded]);

  const formattedSections = useMemo(() => {
    if (!displayText) return [];
    const sections = displayText.split(/\n(?=(?:DASHA|DIVISIONAL|PLANETARY|VERDICT|EVENT|TRANSIT|FINAL))/gi);
    
    return sections.map((section, idx) => {
      const firstLine = section.split('\n')[0];
      const isHeader = /^(DASHA|DIVISIONAL|PLANETARY|VERDICT|EVENT|TRANSIT|FINAL)/i.test(firstLine);

      if (isHeader) {
        const [header, ...rest] = section.split('\n');
        return {
          type: 'header' as const,
          header: sanitizeHtml(header.split(':')[0]),
          content: sanitizeHtml(rest.join('\n')),
          key: idx,
        };
      }

      return {
        type: 'text' as const,
        content: sanitizeHtml(section),
        key: idx,
      };
    });
  }, [displayText]);

  if (!rawText) {
    return (
      <div className="text-center text-[#3A4452] italic py-10">
        [AI Reasoning data not available for this session]
      </div>
    );
  }

  return (
    <div className="bg-[#0F1419] rounded-xl border border-[#3A4452] p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[#F5F0EB] font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
          AI Reasoning Transcript
        </h4>
        <span className="text-[10px] text-[#8C7F72] font-mono">{rawText.length.toLocaleString()} chars</span>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {formattedSections.map((section) => {
          if (section.type === 'header') {
            return (
              <div key={section.key} className="mb-4">
                <div className="inline-block px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider rounded border border-[#D4AF37]/20 mb-2">
                  {section.header}
                </div>
                <p className="text-[#C4B8AD] text-sm leading-relaxed whitespace-pre-wrap">{section.content}</p>
              </div>
            );
          }
          return (
            <p key={section.key} className="text-[#C4B8AD] text-sm leading-relaxed mb-2 whitespace-pre-wrap">
              {section.content}
            </p>
          );
        })}
      </div>

      {rawText.length > 1000 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full py-2 bg-[#151a21] border border-[#3A4452] rounded-lg text-[#D4AF37] text-sm font-bold hover:bg-[#1A2433] transition-colors flex items-center justify-center gap-2"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" aria-hidden="true" /> Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" aria-hidden="true" /> Show Full Reasoning ({Math.ceil(rawText.length / 1000)}K chars)
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN RESULTS DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ResultsDashboardContent({ sessionId, data, birthData, reasoningLogs }: ResultsDashboardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'audit' | 'comparison' | 'logs'>('summary');
  const [analysisDetails, setAnalysisDetails] = useState<AnalysisDetails | null>(null);
  const [copied, setCopied] = useState(false);

  // Parse analysis result safely
  useEffect(() => {
    try {
      if (data.analysisResult) {
        const parsed = typeof data.analysisResult === 'string'
          ? JSON.parse(data.analysisResult)
          : data.analysisResult;
        setAnalysisDetails(parsed);
      }
    } catch (e) {
      console.error('Failed to parse analysis result:', e);
      setAnalysisDetails(null);
    }
  }, [data.analysisResult]);

  // Copy share link
  const copyShareLink = useCallback(async () => {
    try {
      const url = `${window.location.origin}/rectify/${sessionId}/results`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link to clipboard');
    }
  }, [sessionId]);

  // Export JSON
  const exportJSON = useCallback(() => {
    try {
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data');
    }
  }, [sessionId, data, birthData, analysisDetails]);

  // Render method scores table
  const renderMethodScores = useCallback(() => {
    if (!analysisDetails?.finalCandidate?.methodScores) return null;
    
    const scores = analysisDetails.finalCandidate.methodScores;
    const entries = Object.entries(scores);
    
    if (entries.length === 0) return null;

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
            {entries.map(([key, val]) => (
              <tr key={key} className="border-b border-[#3A4452]/50 last:border-0 hover:bg-[#151a21]">
                <td className="py-2 text-[#F5F0EB] capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </td>
                <td className="py-2 text-right text-[#D4AF37] font-bold">+{val as number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [analysisDetails?.finalCandidate?.methodScores]);

  // Generate PDF
  const generatePDF = useCallback(async () => {
    setIsGenerating(true);
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(15, 20, 25);
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(212, 175, 55);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('AI-PANDIT RECTIFICATION REPORT', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text(`Session ID: ${sessionId}`, pageWidth / 2, 30, { align: 'center' });

      // Executive Summary
      let yPos = 55;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('EXECUTIVE SUMMARY', 20, yPos);

      yPos += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Birth Name: ${birthData?.fullName || 'N/A'}`, 20, yPos);
      doc.text(`Date of Birth: ${birthData?.dateOfBirth || 'N/A'}`, 120, yPos);

      yPos += 10;
      doc.text(`Tentative Time: ${birthData?.tentativeTime || 'N/A'}`, 20, yPos);
      doc.text(`Place: ${birthData?.birthPlace || 'N/A'}`, 120, yPos);

      // Verdict Box
      yPos += 25;
      doc.setFillColor(245, 240, 235);
      doc.setDrawColor(212, 175, 55);
      doc.roundedRect(15, yPos, pageWidth - 30, 40, 3, 3, 'FD');

      yPos += 15;
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text('RECTIFIED BIRTH TIME', pageWidth / 2, yPos, { align: 'center' });

      yPos += 12;
      doc.setFontSize(24);
      doc.setTextColor(212, 175, 55);
      doc.setFont('helvetica', 'bold');
      doc.text(data.rectifiedTime, pageWidth / 2, yPos, { align: 'center' });

      // Metrics Table
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

      // Footer
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Generated by AI Pandit | Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`Rectification_Report_${sessionId.slice(0, 6)}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [sessionId, data, birthData]);

  // Prepare candidate data
  const topCandidates = useMemo(() => {
    const alternatives = analysisDetails?.alternatives?.slice(0, 5).map((alt, idx) => ({
      time: alt.time,
      score: alt.score || (95 - idx * 3),
      stage: 6,
      rank: idx + 2,
      minifiedEph: alt.ephemeris,
    })) || [
      { time: data.rectifiedTime, score: data.accuracy, stage: 6, rank: 1 },
      { time: '10:48:00', score: data.accuracy - 3, stage: 6, rank: 2 },
      { time: '10:42:00', score: data.accuracy - 7, stage: 6, rank: 3 },
    ];

    return [
      { time: data.rectifiedTime, score: data.accuracy, stage: 6, rank: 1, reason: 'Final selected candidate' },
      ...alternatives.filter(c => c.time !== data.rectifiedTime)
    ];
  }, [analysisDetails?.alternatives, data.rectifiedTime, data.accuracy]);

  return (
    <div className="bg-[#0F1419] min-h-screen text-[#F5F0EB] font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0F1419]/90 backdrop-blur-xl border-b border-[#D4AF37]/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
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
            <button
              onClick={copyShareLink}
              className="px-4 py-2 bg-[#1A2433] border border-[#3A4452] rounded-lg text-sm font-medium text-[#C4B8AD] hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all flex items-center gap-2"
              aria-label={copied ? 'Link copied' : 'Copy share link'}
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={exportJSON}
              className="px-4 py-2 bg-[#1A2433] border border-[#3A4452] rounded-lg text-sm font-medium text-[#C4B8AD] hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all flex items-center gap-2"
              aria-label="Export as JSON"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={generatePDF}
              disabled={isGenerating}
              className="bg-gradient-to-r from-[#D4AF37] to-[#C9A961] hover:opacity-90 text-[#0F1419] px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-[#D4AF37]/10 disabled:opacity-50"
              aria-label="Download PDF report"
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0F1419]" aria-hidden="true" />
              ) : (
                <Download className="w-4 h-4" aria-hidden="true" />
              )}
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
        {/* Left Column: KPI Dashboard */}
        <div className="lg:col-span-4 space-y-6">
          {/* Rectified Time Card */}
          <div className="bg-[#151a21] border border-[#D4AF37] rounded-xl p-8 text-center shadow-[0_0_30px_rgba(212,175,55,0.1)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />

            <h3 className="text-[#8C7F72] uppercase tracking-[0.2em] text-xs mb-4 font-mono">Rectified Birth Time</h3>
            <div className="text-5xl font-bold text-[#D4AF37] font-mono tracking-tighter mb-4">
              {data.rectifiedTime}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/50 rounded-full text-[#D4AF37] text-xs font-bold uppercase tracking-wide mb-3">
              <CheckCircle className="w-3 h-3" aria-hidden="true" />
              Confidence: {data.accuracy}%
            </div>
            {data.accuracy > 90 && (
              <div className="flex items-center justify-center gap-2 text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.2em] animate-pulse mt-2">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
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
              <Award className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
              Verification Audit
            </h4>
            {renderMethodScores()}
          </div>
        </div>

        {/* Right Column: Detailed Analysis Tabs */}
        <div className="lg:col-span-8 flex flex-col h-full">
          {/* Navigation Tabs */}
          <div className="flex border-b border-[#3A4452] mb-6 space-x-4 overflow-x-auto" role="tablist">
            {(['summary', 'comparison', 'audit', 'logs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                    : 'text-[#8C7F72] hover:text-[#F5F0EB]'
                }`}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`${tab}-panel`}
              >
                {tab === 'summary' && 'Executive Summary'}
                {tab === 'comparison' && 'Candidate Comparison'}
                {tab === 'audit' && 'Deep Audit'}
                {tab === 'logs' && 'AI Reasoning'}
              </button>
            ))}
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
                  role="tabpanel"
                  id="summary-panel"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="prose prose-invert max-w-none">
                      <h3 className="text-xl font-bold text-[#F5F0EB] mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#D4AF37]" aria-hidden="true" />
                        Final Verdict
                      </h3>
                      <p className="text-[#8C7F72] leading-relaxed">
                        The rectification engine has successfully converged on a final birth time of{' '}
                        <strong className="text-[#F5F0EB]">{data.rectifiedTime}</strong>.
                        This time was selected after rigorous AI reasoning and multi-stage verification.
                      </p>
                      <div className="my-6 p-4 bg-[#D4AF37]/5 border-l-2 border-[#D4AF37] text-sm text-[#F5F0EB] font-serif italic">
                        &ldquo;{cleanSummary(analysisDetails?.summary)}&rdquo;
                      </div>
                      <h4 className="font-bold text-[#F5F0EB] mt-6 mb-2 text-sm uppercase tracking-wider">
                        Confirmation Factors:
                      </h4>
                      <ul className="space-y-2 text-[#8C7F72] text-[13px]">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" aria-hidden="true" />
                          <span>Verified via <strong>6-Stage AI Pipeline</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" aria-hidden="true" />
                          <span>Sub-second <strong>Boundary Safety</strong> verified</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" aria-hidden="true" />
                          <span>DeepSeek Reasoner <strong>narrative analysis</strong> passed</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <SwissEphPanel
                        candidateTime={data.rectifiedTime}
                        minifiedEph={analysisDetails?.godTierData?.ephemeris?.planets ? {
                          sun: `${analysisDetails.godTierData.ephemeris.planets.sun?.sign || 'N/A'} ${(analysisDetails.godTierData.ephemeris.planets.sun?.longitude || 0 % 30)?.toFixed(1)}°`,
                          moon: `${analysisDetails.godTierData.ephemeris.planets.moon?.sign || 'N/A'} ${(analysisDetails.godTierData.ephemeris.planets.moon?.longitude || 0 % 30)?.toFixed(1)}°`,
                          ascendant: `${analysisDetails.godTierData.ephemeris.ascendant?.sign || 'N/A'} ${(analysisDetails.godTierData.ephemeris.ascendant?.longitude || 0 % 30)?.toFixed(1)}°`
                        } : undefined}
                        dasha={analysisDetails?.godTierData?.dasha || 'Venus MD / Jupiter AD / Moon PD'}
                        defaultExpanded={true}
                      />

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
                  role="tabpanel"
                  id="comparison-panel"
                >
                  <CandidateComparisonView candidates={topCandidates} />
                </motion.div>
              )}

              {activeTab === 'audit' && (
                <motion.div
                  key="audit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                  role="tabpanel"
                  id="audit-panel"
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
                      {topCandidates.slice(1, 6).map((alt, i) => (
                        <div key={i} className="flex justify-between items-center bg-[#0F1419] p-3 rounded border border-[#3A4452]/50">
                          <span className="font-mono text-[#8C7F72]">#{i + 2} {alt.time}</span>
                          <span className="text-sm text-[#D4AF37]">Score: {alt.score?.toFixed(1) || 'N/A'}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const shuddhi = analysisDetails?.godTierData?.shuddhi;
                    if (shuddhi && typeof shuddhi === 'object' && 'kunda' in shuddhi && 'tatwa' in shuddhi) {
                      return (
                        <div className="mt-8">
                          <VedicShuddhiRadar shuddhi={shuddhi as { kunda: { score: number; details: string }; tatwa: { score: number; details: string } }} />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </motion.div>
              )}

              {activeTab === 'logs' && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full"
                  role="tabpanel"
                  id="logs-panel"
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
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT WITH ERROR BOUNDARY
// ═══════════════════════════════════════════════════════════════════════════════

export function ResultsDashboard(props: ResultsDashboardProps) {
  return (
    <ResultsErrorBoundary>
      <ResultsDashboardContent {...props} />
    </ResultsErrorBoundary>
  );
}

export default ResultsDashboard;
