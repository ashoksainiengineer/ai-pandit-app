/**
 * Hero Section - Birth Time Rectification Platform
 * Clear, focused messaging that communicates the core value proposition
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowRight, 
  Play, 
  Clock,
  Target,
  Sparkles,
  Telescope,
  Brain,
  Server,
  Database,
  Code2
} from 'lucide-react';
import { Suspense, lazy } from 'react';

const AIThinkingBox = lazy(() => import('./AIThinkingBox'));
const EphemerisTable = lazy(() => import('./EphemerisTable'));
const CandidateComparisonTable = lazy(() => import('./CandidateComparisonTable'));

// Real tech stack from package.json
const techStack = [
  { name: 'Swiss Ephemeris', icon: Telescope },
  { name: 'DeepSeek AI', icon: Brain },
  { name: 'Turso DB', icon: Database },
  { name: 'Next.js', icon: Server },
  { name: 'TypeScript', icon: Code2 },
];

// Core stats - actual achievable metrics
const coreStats = [
  { 
    value: 'Seconds-Level', 
    label: 'Precision', 
    icon: Target,
    desc: 'Sub-minute accuracy' 
  },
  { 
    value: '97%+', 
    label: 'Confidence', 
    icon: Sparkles,
    desc: 'AI-validated results' 
  },
  { 
    value: '40-50min', 
    label: 'Analysis', 
    icon: Clock,
    desc: 'Deep processing' 
  },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-[#0A0F1C] overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(to right, #8B5CF6 1px, transparent 1px),
                           linear-gradient(to bottom, #8B5CF6 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {/* Tech Stack Row */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-6"
        >
          {techStack.map((tech, index) => {
            const Icon = tech.icon;
            return (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1F2E]/60 border border-[#2A3442] rounded-full"
              >
                <Icon className="w-3 h-3 text-[#8B5CF6]" />
                <span className="text-[11px] text-[#8C7F72]">{tech.name}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main Content */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1F2E] border border-[#8B5CF6]/30 rounded-full text-[#8B5CF6] text-sm font-medium mb-6"
          >
            <span className="text-lg">🕉️</span>
            <span>Vedic Birth Time Rectification</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#F5F0EB] leading-tight mb-6"
          >
            Discover Your{' '}
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] bg-clip-text text-transparent">
              Exact Birth Time
            </span>
          </motion.h1>

          {/* USP Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-[#8C7F72] mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Highly accurate birth time rectification within <span className="text-[#D4AF37] font-semibold">seconds-level precision</span>. 
            Powered by Swiss Ephemeris high-precision astronomical data and DeepSeek AI's 
            advanced reasoning capabilities. Get your true birth time through 
            algorithmic Vedic analysis.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-10"
          >
            <Link href="/rectify">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white font-bold text-base rounded-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center gap-2"
              >
                Start Analysis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-[#1A1F2E] border border-[#2A3442] text-[#F5F0EB] font-semibold text-base rounded-xl hover:border-[#8B5CF6]/30 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              See How It Works
            </motion.button>
          </motion.div>

          {/* Core Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-3 max-w-lg mx-auto"
          >
            {coreStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="p-4 bg-[#1A1F2E]/50 border border-[#2A3442] rounded-xl text-center"
                >
                  <Icon className="w-4 h-4 text-[#D4AF37] mx-auto mb-2" />
                  <div className="text-lg sm:text-xl font-bold text-[#F5F0EB]">{stat.value}</div>
                  <div className="text-[10px] text-[#8C7F72] uppercase tracking-wider">{stat.label}</div>
                  <div className="text-[9px] text-[#5A6475] mt-0.5">{stat.desc}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Live Analysis Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-[#F5F0EB]">Live Analysis Engine</span>
            </div>
            <span className="text-xs text-[#8C7F72]">Always Running</span>
          </div>

          {/* AI Thinking Box */}
          <Suspense fallback={<div className="h-80 bg-[#1A1F2E] rounded-xl animate-pulse border border-[#2A3442]" />}>
            <AIThinkingBox />
          </Suspense>

          {/* Ephemeris Data */}
          <Suspense fallback={<div className="h-64 bg-[#1A1F2E] rounded-xl animate-pulse border border-[#2A3442]" />}>
            <EphemerisTable />
          </Suspense>

          {/* Candidate Analysis */}
          <Suspense fallback={<div className="h-96 bg-[#1A1F2E] rounded-xl animate-pulse border border-[#2A3442]" />}>
            <CandidateComparisonTable />
          </Suspense>
        </motion.div>
      </div>
    </section>
  );
}
