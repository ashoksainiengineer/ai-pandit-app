/**
 * Hero Section - God-Tier Technical Showcase
 * Ultra-transparent, engineering-focused hero with dark theme
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  Terminal,
  Cpu,
  Database,
  Brain,
  Activity,
  Zap,
  Server,
  Telescope,
  Star,
  TerminalSquare,
} from 'lucide-react';
import { Suspense, lazy } from 'react';
import Image from 'next/image';

const AIThinkingBox = lazy(() => import('./AIThinkingBox'));
const EphemerisTable = lazy(() => import('./EphemerisTable'));
const CandidateComparisonTable = lazy(() => import('./CandidateComparisonTable'));

const techBadges = [
  { name: 'Swiss Ephemeris', icon: Telescope, color: '#8B5CF6' },
  { name: 'DeepSeek R1', icon: Brain, color: '#6366F1' },
  { name: 'Turso Database', icon: Database, color: '#D4AF37' },
  { name: 'Drizzle ORM', icon: Database, color: '#00DC82' },
  { name: 'Next.js', icon: Server, color: '#F5F0EB' },
  { name: 'TypeScript', icon: Cpu, color: '#3178C6' },
];

const godTierStats = [
  { value: '±15s', label: 'Precision', icon: Activity, desc: 'Arcsecond accuracy' },
  { value: '96.8%', label: 'Confidence', icon: Star, desc: 'God-Tier verified' },
  { value: '40-50m', label: 'Processing', icon: Zap, desc: 'Full analysis time' },
];

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen bg-[#0A0F1C] overflow-hidden">
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-[#8B5CF6]/5 via-[#6366F1]/3 to-transparent rounded-full blur-3xl"
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(to right, #8B5CF6 1px, transparent 1px),
                           linear-gradient(to bottom, #8B5CF6 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-8"
        >
          {techBadges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1F2E]/80 border border-[#2A3442] rounded-full backdrop-blur-sm"
              >
                <Icon className="w-3 h-3" style={{ color: badge.color }} />
                <span className="text-xs font-medium text-[#8C7F72]">{badge.name}</span>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="relative w-12 h-12">
              <Image src="/om-logo.png" alt="AI Pandit OM Logo" fill className="object-contain" priority />
            </div>
            <span className="text-2xl font-bold text-[#F5F0EB]">AI Pandit</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1F2E] border border-[#8B5CF6]/30 rounded-full text-[#8B5CF6] text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Birth Time Rectification Engine
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#F5F0EB] leading-tight mb-6">
            Engineering{' '}
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] bg-clip-text text-transparent">
              Astrological
            </span>
            {' '}Precision
          </h1>

          <p className="text-lg md:text-xl text-[#8C7F72] mb-8 max-w-2xl mx-auto leading-relaxed">
            NASA-grade Swiss Ephemeris calculations fused with DeepSeek R1-0528.
            Achieve God-Tier precision in birth time rectification through
            algorithmic Vedic analysis.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-10 justify-center">
            <Link href="/rectify">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white font-bold text-lg rounded-xl hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
              >
                Start Analysis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-10 max-w-xl mx-auto">
            {godTierStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="p-4 bg-[#1A1F2E]/50 border border-[#2A3442] rounded-xl"
                >
                  <Icon className="w-5 h-5 text-[#D4AF37] mb-2" />
                  <div className="text-2xl font-bold text-[#F5F0EB] font-mono">{stat.value}</div>
                  <div className="text-xs text-[#8C7F72] uppercase tracking-wider">{stat.label}</div>
                  <div className="text-[10px] text-[#5A6475] mt-1">{stat.desc}</div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-xs text-[#5A6475] justify-center">
            <span>aipandit.app</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-5xl mx-auto space-y-8"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <TerminalSquare className="w-5 h-5 text-[#8B5CF6]" />
                <h2 className="text-xl font-bold text-[#F5F0EB]">Live Analysis Engine</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">ALWAYS RUNNING</span>
              </div>
            </div>
            <p className="text-[#8C7F72] mb-4 text-sm">Powered by Hugging Face Space</p>
            <Suspense fallback={<div className="h-80 bg-[#1A1F2E] rounded-xl animate-pulse border border-[#2A3442]" />}>
              <AIThinkingBox />
            </Suspense>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Telescope className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-xl font-bold text-[#F5F0EB]">Swiss Ephemeris Precision Data</h2>
            </div>
            <Suspense fallback={<div className="h-64 bg-[#1A1F2E] rounded-xl animate-pulse border border-[#2A3442]" />}>
              <EphemerisTable />
            </Suspense>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-[#6366F1]" />
              <h2 className="text-xl font-bold text-[#F5F0EB]">BTR Candidate Analysis</h2>
            </div>
            <Suspense fallback={<div className="h-96 bg-[#1A1F2E] rounded-xl animate-pulse border border-[#2A3442]" />}>
              <CandidateComparisonTable />
            </Suspense>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
