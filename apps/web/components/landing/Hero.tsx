/**
 * Hero Section - Sacred Ivory Edition
 * Soothing light theme with divine typography
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
  ChevronDown
} from 'lucide-react';
import { Suspense, lazy } from 'react';

const AIThinkingBox = lazy(() => import('./AIThinkingBox'));
const EphemerisTable = lazy(() => import('./EphemerisTable'));
const CandidateComparisonTable = lazy(() => import('./CandidateComparisonTable'));

// Core stats with warm colors
const coreStats = [
  {
    value: 'Within Seconds',
    label: 'Precision',
    icon: Target,
    desc: 'Exact birth time',
    color: '#B8860B'
  },
  {
    value: '97%+',
    label: 'Confidence',
    icon: Sparkles,
    desc: 'AI validation',
    color: '#6B1F7A'
  },
  {
    value: '~1 Hour',
    label: 'Analysis',
    icon: Clock,
    desc: 'Deep computation',
    color: '#4A7C6F'
  },
];

// Anti-Gravity: Hoisted static icons to prevent re-allocation
const SecurityShieldIcon = () => (
  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Elegant Background Elements */}
      <div className="absolute inset-0">
        {/* Soft gold glow top-right */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-amber-100/60 via-amber-50/30 to-transparent rounded-full blur-3xl" />

        {/* Soft plum glow bottom-left */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-purple-100/40 via-purple-50/20 to-transparent rounded-full blur-3xl" />

        {/* Sage accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-emerald-50/30 via-transparent to-transparent rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8 pt-28 pb-16">
        {/* Main Content */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Sacred Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FDF8F3] to-white
                       border border-[#F0E8DE] rounded-full text-sm mb-8 shadow-sm"
          >
            <span className="text-[#6B1F7A] font-medium">Vedic Birth Time Rectification</span>
            <span className="text-[10px] px-2 py-0.5 bg-[#B8860B]/10 text-[#B8860B] rounded-full">by Swiss Ephemeris</span>
            <span className="text-[10px] px-2 py-0.5 bg-[#4A7C6F]/10 text-[#4A7C6F] rounded-full">by DeepSeek R1-0528</span>
          </motion.div>

          {/* Main Headline - Elegant Typography */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <h1 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl lg:text-6xl xl:text-7xl
                           font-semibold text-[#1A1612] leading-tight tracking-tight">
              Discover Your{' '}
              <span className="text-gradient-gold">Exact Birth Time</span>
            </h1>
            <p className="mt-4 text-lg text-[#7A756F] font-light italic">
              by <span className="font-[family-name:var(--font-cormorant)] text-2xl text-[#B8860B] font-semibold not-italic">AI Pandit</span>
            </p>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-[#4A453F] mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Highly accurate birth time rectification within{' '}
            <span className="text-[#B8860B] font-semibold">seconds-level precision</span>.
            Powered by Swiss Ephemeris astronomical data and DeepSeek AI,
            aligned with ancient Vedic wisdom.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <Link href="/rectify">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative px-10 py-4 bg-gradient-to-r from-[#B8860B] via-[#D4A853] to-[#E5C880]
                           text-white font-semibold text-base rounded-xl shadow-lg shadow-amber-500/25
                           overflow-hidden transition-all duration-300"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Begin Your Journey
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                                translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Core Stats - Elegant Cards */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            {coreStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                  className="group relative p-5 bg-white border border-[#F0E8DE] rounded-2xl
                             hover:border-[#D4A853]/30 hover:shadow-lg transition-all duration-300"
                >
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at center, ${stat.color}08 0%, transparent 70%)`
                    }}
                  />

                  <div className="relative">
                    <Icon className="w-5 h-5 mx-auto mb-3" style={{ color: stat.color }} />
                    <div className="font-[family-name:var(--font-cormorant)] text-xl sm:text-2xl font-semibold text-[#1A1612] mb-1">
                      {stat.value}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-[#7A756F]">{stat.label}</div>
                    <div className="text-[9px] text-[#A8A39D] mt-1">{stat.desc}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Security Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <SecurityShieldIcon />
              <div className="text-left">
                <div className="text-sm font-semibold text-emerald-800">Your Data is Protected</div>
                <div className="text-xs text-emerald-600">AES-256 End-to-End Encryption • Only you can access your data</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Live Analysis Section */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-40" />
              </div>
              <span className="text-sm font-medium text-[#1A1612]">Live Analysis Engine</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D4A853] text-[#B8860B]
                         text-sm rounded-lg hover:bg-[#FDF8F3] transition-colors"
            >
              <Play className="w-4 h-4" />
              See How It Works
            </motion.button>
          </div>

          {/* Analysis Components */}
          <Suspense fallback={
            <div className="h-40 bg-white rounded-2xl animate-pulse border border-[#F0E8DE] flex items-center justify-center">
              <div className="text-[#A8A39D] text-xs font-mono">Initializing AI Thinking...</div>
            </div>
          }>
            <AIThinkingBox />
          </Suspense>

          <Suspense fallback={
            <div className="h-32 bg-white rounded-2xl animate-pulse border border-[#F0E8DE] flex items-center justify-center">
              <div className="text-[#A8A39D] text-xs font-mono">Loading Ephemeris Data...</div>
            </div>
          }>
            <EphemerisTable />
          </Suspense>

          <Suspense fallback={
            <div className="h-48 bg-white rounded-2xl animate-pulse border border-[#F0E8DE] flex items-center justify-center">
              <div className="text-[#A8A39D] text-xs font-mono">Preparing Comparison Matrix...</div>
            </div>
          }>
            <CandidateComparisonTable />
          </Suspense>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="flex justify-center mt-16"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 text-[#A8A39D]"
          >
            <span className="text-xs uppercase tracking-[0.2em]">Scroll to explore</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
