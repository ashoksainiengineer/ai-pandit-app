/**
 * AI Thinking Box Component - Light Theme Edition
 * Matrix-style terminal with real-time streaming analysis
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Activity, Database, Brain } from 'lucide-react';

interface LogEntry {
  id: number;
  timestamp: string;
  type: 'info' | 'process' | 'success' | 'calculation' | 'astrology';
  message: string;
}

const analysisSequence = [
  { type: 'info' as const, message: 'Initializing AI Pandit BTR Engine...', delay: 0 },
  { type: 'info' as const, message: 'Loading environment configuration...', delay: 100 },
  { type: 'success' as const, message: '✓ Node.js runtime detected', delay: 200 },
  { type: 'info' as const, message: 'Importing swisseph-wasm...', delay: 300 },
  { type: 'process' as const, message: 'Loading ephemeris files: sepl_18.se1, semo_18.se1', delay: 400 },
  { type: 'success' as const, message: '✓ Swiss Ephemeris initialized', delay: 500 },
  { type: 'info' as const, message: 'Connecting to Turso database...', delay: 600 },
  { type: 'success' as const, message: '✓ Database connected', delay: 700 },
  { type: 'info' as const, message: 'Loading drizzle-orm schema...', delay: 800 },
  { type: 'success' as const, message: '✓ Sessions table validated', delay: 900 },
  { type: 'info' as const, message: 'Initializing Session Event Manager...', delay: 1000 },
  { type: 'success' as const, message: '✓ SSE emitter ready', delay: 1100 },
  { type: 'success' as const, message: '✓ BTRSystem Architecture initialized', delay: 1200 },

  // Stage 1
  { type: 'process' as const, message: '═══════════════════════════════════════════', delay: 1300 },
  { type: 'process' as const, message: 'STAGE 1: Exhaustive Data Generation', delay: 1400 },
  { type: 'info' as const, message: 'Session: sess_8f2a9b1c4d5e6f7a', delay: 1500 },
  { type: 'info' as const, message: 'Input: 1990-06-15, 08:30:00, Mumbai', delay: 1600 },
  { type: 'calculation' as const, message: 'Offset: ±30 minutes', delay: 1700 },
  { type: 'success' as const, message: '✓ Generated 1,440 candidates', delay: 1800 },
  { type: 'calculation' as const, message: 'Julian Day: 2458006.854166667', delay: 1900 },
  { type: 'calculation' as const, message: 'Ayanamsa: 24°28\'15.23"', delay: 2000 },

  // Stage 2
  { type: 'process' as const, message: '═══════════════════════════════════════════', delay: 2100 },
  { type: 'process' as const, message: 'STAGE 2: Batch Tournament', delay: 2200 },
  { type: 'info' as const, message: 'Dynamic batch sizing enabled', delay: 2300 },
  { type: 'info' as const, message: 'Survivors per batch: 30%', delay: 2400 },
  { type: 'process' as const, message: 'Splitting into 145 batches...', delay: 2500 },
  { type: 'astrology' as const, message: '⟳ Computing Vimshottari Dasha...', delay: 2600 },
  { type: 'calculation' as const, message: 'Moon nakshatra: Ardra', delay: 2700 },
  { type: 'success' as const, message: '✓ Stage 2: 435 survivors', delay: 2800 },

  // Stage 3
  { type: 'process' as const, message: '═══════════════════════════════════════════', delay: 2900 },
  { type: 'process' as const, message: 'STAGE 3: Refinement Grid', delay: 3000 },
  { type: 'calculation' as const, message: '08:30:00: Sun Taurus 28.49°, Moon Gemini 13.17°', delay: 3100 },
  { type: 'astrology' as const, message: '⟳ Computing D9 Navamsa...', delay: 3200 },
  { type: 'success' as const, message: '✓ Stage 3: 310 refined candidates', delay: 3300 },

  // Stage 4
  { type: 'process' as const, message: '═══════════════════════════════════════════', delay: 3400 },
  { type: 'process' as const, message: 'STAGE 4: Deep Multi-Dasha Analysis', delay: 3500 },
  { type: 'astrology' as const, message: '⟳ Vimshottari hierarchy (MH→AD→PD→SD→PrD)', delay: 3600 },
  { type: 'astrology' as const, message: '⟳ Computing Yogini Dasha...', delay: 3700 },
  { type: 'process' as const, message: 'Event correlation: Marriage (2019)', delay: 3800 },
  { type: 'calculation' as const, message: 'Jupiter: 5th house aspect triggered', delay: 3900 },
  { type: 'astrology' as const, message: '⟳ Computing Ashtakavarga bindus...', delay: 4000 },
  { type: 'calculation' as const, message: 'SAV: 337 bindus', delay: 4100 },
  { type: 'success' as const, message: '✓ Stage 4: 21 finalists', delay: 4200 },

  // Stage 5
  { type: 'process' as const, message: '═══════════════════════════════════════════', delay: 4300 },
  { type: 'process' as const, message: 'STAGE 5: Micro Precision Grid', delay: 4400 },
  { type: 'astrology' as const, message: '⟳ Computing D60 Shashtyamsa deities...', delay: 4500 },
  { type: 'calculation' as const, message: '08:30:00 D60: Pisces | Deity: Amrita', delay: 4600 },
  { type: 'success' as const, message: '✓ Stage 5: 15 micro candidates', delay: 4700 },

  // Stage 6
  { type: 'process' as const, message: '═══════════════════════════════════════════', delay: 4800 },
  { type: 'process' as const, message: 'STAGE 6: Final Precision Judgement', delay: 4900 },
  { type: 'calculation' as const, message: 'DeepSeek R1-0528 connected', delay: 5000 },
  { type: 'astrology' as const, message: '⟳ Analyzing Vimsopaka Bala scores...', delay: 5100 },
  { type: 'astrology' as const, message: '⟳ Verifying spouse synastry...', delay: 5200 },

  // Final Results
  { type: 'process' as const, message: '═══════════════════════════════════════════', delay: 5300 },
  { type: 'process' as const, message: 'FINAL RESULTS', delay: 5400 },
  { type: 'success' as const, message: '✓ Birth Time Rectified: 08:32:30 AM IST', delay: 5500 },
  { type: 'success' as const, message: '✓ Confidence: 96.8% | Accuracy: ±15 seconds', delay: 5600 },
  { type: 'info' as const, message: 'Processing: 38.2 seconds', delay: 5700 },
  { type: 'info' as const, message: 'Ephemeris calls: 2,887 | AI calls: 165', delay: 5800 },
  { type: 'success' as const, message: '✓ Report complete: 23 pages', delay: 5900 },
  { type: 'process' as const, message: '═══════════════════════════════════════════', delay: 6000 },
  { type: 'process' as const, message: 'RESTARTING ANALYSIS SEQUENCE...', delay: 6100 },
];

const typeColors = {
  info: 'text-[#7A756F]',
  process: 'text-[#6B1F7A]',
  success: 'text-emerald-600',
  calculation: 'text-[#B8860B]',
  astrology: 'text-[#4A7C6F]',
};

const typeIcons = {
  info: Database,
  process: Cpu,
  success: Activity,
  calculation: Terminal,
  astrology: Activity,
};

// Static timestamp to avoid hydration mismatch
const STATIC_TIME = '15:22:30';

export default function AIThinkingBox() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isRunningRef = useRef(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
  }, []);

  const runSequence = useCallback(() => {
    if (!isRunningRef.current) return;

    analysisSequence.forEach((entry) => {
      const timeout = setTimeout(() => {
        if (!isRunningRef.current) return;
        
        const newLog: LogEntry = {
          id: logIdRef.current++,
          timestamp: STATIC_TIME,
          type: entry.type,
          message: entry.message,
        };
        setLogs(prev => [...prev.slice(-40), newLog]);
      }, entry.delay);
      timeoutsRef.current.push(timeout);
    });

    // Schedule next loop
    const loopTimeout = setTimeout(() => {
      if (isRunningRef.current) {
        runSequence();
      }
    }, 6200);
    
    timeoutsRef.current.push(loopTimeout);
  }, []);

  // Auto-start on mount
  useEffect(() => {
    isRunningRef.current = true;
    runSequence();
    
    return () => {
      isRunningRef.current = false;
      clearAllTimeouts();
    };
  }, [runSequence, clearAllTimeouts]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isClient) {
    return (
      <div className="rounded-2xl border border-[#F0E8DE] bg-white overflow-hidden h-80">
        <div className="h-full flex items-center justify-center">
          <div className="text-[#7A756F]">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#F0E8DE] bg-white overflow-hidden shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#FDF8F3] border-b border-[#F0E8DE]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1A1612]">AI Pandit BTR Engine</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 font-semibold">
                RUNNING
              </span>
            </div>
            <p className="text-[10px] text-[#7A756F] font-mono">
              Swiss Ephemeris • Hugging Face Space • DeepSeek R1-0528
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-600 font-medium tracking-widest">LIVE</span>
          </div>
        </div>

        {/* Terminal Content */}
        <div 
          ref={scrollRef}
          className="h-72 overflow-y-auto p-5 font-mono text-xs bg-[#FFFCF8] scroll-smooth"
        >
          <pre className="whitespace-pre-wrap break-words text-[#4A453F] leading-relaxed">
            {logs.map((log) => {
              const Icon = typeIcons[log.type];
              return (
                <motion.div
                  key={`${log.id}-${log.timestamp}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 py-0.5"
                >
                  <span className="text-[#A8A39D] shrink-0">[{log.timestamp}]</span>
                  <Icon className={`w-3 h-3 mt-0.5 shrink-0 ${typeColors[log.type]}`} />
                  <span className={`${typeColors[log.type]} break-all`}>{log.message}</span>
                </motion.div>
              );
            })}
            <span
              className={`inline-block w-2 h-4 bg-[#6B1F7A] ml-0.5 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}
              style={{ verticalAlign: 'text-bottom' }}
            />
          </pre>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center px-5 py-3 bg-[#FDF8F3] border-t border-[#F0E8DE] text-xs">
          <div className="flex items-center gap-2 text-[#7A756F]">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>AES-256 End-to-End Encrypted</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
