'use client';

// components/rectify/AIThinkingStream.tsx
// Real-time AI thinking display with typewriter animation

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIThinkingStreamProps {
    thinking: {
        stage: number;
        candidateTime?: string;
        fullText: string;
    } | null;
    isActive: boolean;
    stage?: number; // Explicit stage from parent
}

export default function AIThinkingStream({ thinking, isActive, stage }: AIThinkingStreamProps) {
    const [displayedText, setDisplayedText] = useState('');
    const [cursorVisible, setCursorVisible] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastLengthRef = useRef(0);

    // Smooth text append with auto-scroll
    useEffect(() => {
        if (!thinking?.fullText) {
            setDisplayedText('');
            lastLengthRef.current = 0;
            return;
        }

        // Only append new characters
        if (thinking.fullText.length > lastLengthRef.current) {
            setDisplayedText(thinking.fullText);
            lastLengthRef.current = thinking.fullText.length;

            // Auto-scroll to bottom
            if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
        }
    }, [thinking?.fullText]);

    // Cursor blink effect
    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(() => {
            setCursorVisible(v => !v);
        }, 530);
        return () => clearInterval(interval);
    }, [isActive]);

    if (!isActive && !thinking?.fullText) {
        return null;
    }

    const currentStage = thinking?.stage || stage || 2; // Default to 2 (Level 1) if unknown

    const stageName = {
        2: 'Level 1: Gross Screening',
        5: 'Level 2: Fine Comparison',
        7: 'Level 3: Final Decision (DeepSeek Reasoner)',
    }[currentStage] || 'Level 1: Gross Screening';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card p-6 border border-[#8B5CF6]/30 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center">
                            <span className="text-xl">🧠</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-[#F5F0EB]">{stageName}</h3>
                            {thinking?.candidateTime && (
                                <p className="text-xs text-[#8B5CF6]">
                                    Analyzing: {thinking.candidateTime}
                                </p>
                            )}
                        </div>
                    </div>

                    {isActive && (
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
                            <span className="text-xs text-[#8B5CF6] font-medium">THINKING</span>
                        </div>
                    )}
                </div>

                {/* Thinking Content */}
                <div
                    ref={containerRef}
                    className="bg-[#1A1F2E]/80 rounded-lg p-4 max-h-[300px] overflow-y-auto font-mono text-sm text-[#C4B8AD] leading-relaxed scroll-smooth"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#8B5CF6 #1A1F2E',
                    }}
                >
                    {displayedText ? (
                        <pre className="whitespace-pre-wrap break-words">
                            {displayedText}
                            {isActive && (
                                <span
                                    className={`inline-block w-2 h-4 bg-[#8B5CF6] ml-0.5 ${cursorVisible ? 'opacity-100' : 'opacity-0'
                                        }`}
                                    style={{ verticalAlign: 'text-bottom' }}
                                />
                            )}
                        </pre>
                    ) : (
                        <div className="text-[#8C7F72] flex items-center gap-2">
                            <span className="animate-spin">⚙️</span>
                            Initializing AI reasoning engine...
                        </div>
                    )}
                </div>

                {/* Stats Footer */}
                <div className="mt-4 flex items-center justify-between text-xs text-[#8C7F72]">
                    <span>
                        {displayedText.length.toLocaleString()} characters
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D7A5C]" />
                        DeepSeek {thinking?.stage === 7 ? 'Reasoner (R1)' : 'V3'}
                    </span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
