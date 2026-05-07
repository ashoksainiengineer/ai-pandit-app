/**
 * AI Pandit — Landing Page
 * AI Pandit Landing Page — Light Theme
 * Design spec recreation
 * 5 sections: Hero, How It Works, Features, Privacy, CTA
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  ChevronDown,
  Check,
  Star,
  Moon,
  Calendar,
  Lock as LockIcon,
  BarChart3,
  Timer,
  Radio,
  Settings,
  Activity,
  FileText,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AIThinkingBox from '@/components/landing/AIThinkingBox';
import EphemerisTable from '@/components/landing/EphemerisTable';
import CandidateComparisonTable from '@/components/landing/CandidateComparisonTable';

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS — Easing curves
   ═══════════════════════════════════════════════════════════════════════════════ */


const fadeIn = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: 'easeOut' },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};



const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};


/* ═══════════════════════════════════════════════════════════════════════════════
   DATA — Existing content arrays, retained data
   ═══════════════════════════════════════════════════════════════════════════════ */

const HERO_STATS = [
  { value: 'Seconds', label: 'Precision', icon: Timer },
  { value: '6', label: 'Stage Pipeline', icon: BarChart3 },
  { value: 'NASA JPL', label: 'Ephemeris Data', icon: Activity },
];

const FEATURES_LIST = [
  {
    number: '01',
    title: 'Enter your birth details',
    description: 'Provide your date, approximate time, and birthplace. Even rough estimates work — our AI narrows it down to seconds-level precision using NASA JPL ephemeris data.',
    active: true,
  },
  {
    number: '02',
    title: 'Answer physical traits',
    description: 'Share your natural body type, height, build, and distinguishing features. These forensic markers help our Vedic engine narrow the birth time window with remarkable accuracy.',
    active: false,
  },
  {
    number: '03',
    title: 'Share life events',
    description: 'Provide 3+ significant life events with dates — marriage, career milestones, relocation, health events. The system cross-references them against Vimshottari Dasha periods.',
    active: false,
  },
];

const PRODUCT_CARDS = [
  {
    tag: 'Analysis',
    title: 'Reports',
    description: 'Generate comprehensive astrological reports with planetary positions, Dasha periods, and detailed interpretations.',
    icon: FileText,
    color: '#79C9FF',
  },
  {
    tag: 'Real-time',
    title: 'Live Work',
    description: 'Watch your birth time rectification unfold live with real-time SSE streaming and stage-by-stage progress.',
    icon: Radio,
    color: '#FA3D1D',
  },
  {
    tag: 'Validation',
    title: 'Multi-Method Validation',
    description: 'Cross-validate with Dasha, Transit, KP Sublords, and Shadbala — five independent Vedic methods, one consensus result.',
    icon: Check,
    color: '#FFB005',
  },
  {
    tag: 'Security',
    title: 'End-to-End Encryption',
    description: 'Your birth data is encrypted with AES-256-GCM before it leaves your browser. Per-user unique encryption keys.',
    icon: Shield,
    color: '#FD02F5',
  },
  {
    tag: 'Precision',
    title: 'Splits',
    description: 'Compare multiple candidate birth times side-by-side with detailed scoring and confidence intervals.',
    icon: BarChart3,
    color: '#0358F7',
  },
  {
    tag: 'Organization',
    title: 'Session Dashboard',
    description: 'Manage all your birth time analyses in one clean dashboard. Compare results, revisit past sessions, and export detailed reports.',
    icon: Settings,
    color: '#C679C4',
  },
];

const PRIVACY_FEATURES = [
  { label: 'Encrypt birth data', active: true },
  { label: 'Auto-delete sessions', active: false },
  { label: 'Anonymous analysis', active: true },
  { label: 'No data sharing', active: true },
  { label: 'Export your data', active: false },
];


/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT — Floating Card (Hero decorative UI)
   ═══════════════════════════════════════════════════════════════════════════════ */

function FloatingCard({
  children,
  className = '',
  delay = 0,
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-black/5 p-4 ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT — Hero Section
   ═══════════════════════════════════════════════════════════════════════════════ */

function Hero() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -50]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#FAFAFA]">
      {/* Radial Gradient Background — Radial gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280vw] h-[280vw]"
          style={{
            background: `radial-gradient(
              circle 130vw at center,
              rgba(0, 0, 0, 0) 54.810%,
              rgba(255, 172, 227, 0.6) 60.098%,
              rgba(255, 241, 172, 0.3) 62.983%,
              rgba(121, 201, 255, 0.6) 68.500%,
              rgba(74, 96, 209, 0.4) 80.000%,
              rgba(80, 146, 199, 0.3) 90.000%,
              rgba(60, 106, 255, 0.2) 93.000%,
              rgba(86, 86, 86, 0.1) 97.000%,
              rgba(0, 0, 0, 0) 100.000%
            )`,
          }}
        />
      </div>

      {/* Floating UI Cards — 4 absolute-positioned, frosted glass, staggered */}
      <motion.div style={{ y: y1 }} className="absolute inset-0 pointer-events-none">
        {/* Card 1: Top-left */}
        <FloatingCard
          className="hidden lg:block"
          delay={0.3}
          style={{ left: '8%', top: '18%' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#79C9FF] to-[#0358F7] flex items-center justify-center">
              <Moon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-black">Dasha Analysis</div>
              <div className="text-xs text-black/40">Vimshottari periods</div>
            </div>
          </div>
        </FloatingCard>

        {/* Card 2: Top-right */}
        <FloatingCard
          className="hidden lg:block"
          delay={0.5}
          style={{ right: '10%', top: '15%' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FA3D1D] to-[#FFB005] flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-black">Transit Check</div>
              <div className="text-xs text-black/40">Real-time positions</div>
            </div>
          </div>
        </FloatingCard>

        {/* Card 3: Bottom-left */}
        <FloatingCard
          className="hidden lg:block"
          delay={0.7}
          style={{ left: '5%', bottom: '25%' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FD02F5] to-[#C679C4] flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-black">97% Confidence</div>
              <div className="text-xs text-black/40">High accuracy match</div>
            </div>
          </div>
        </FloatingCard>

        {/* Card 4: Bottom-right */}
        <FloatingCard
          className="hidden lg:block"
          delay={0.9}
          style={{ right: '8%', bottom: '30%' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0358F7] to-[#79C9FF] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-black">Birth Chart</div>
              <div className="text-xs text-black/40">Natal analysis ready</div>
            </div>
          </div>
        </FloatingCard>
      </motion.div>

      {/* Hero Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-20"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-black/5 rounded-full text-xs font-medium text-black/60 uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-[#79C9FF] animate-pulse" />
            Vedic Birth Time Rectification
          </span>
        </motion.div>

        {/* Main Heading — weight 300, tracking -0.04em, line-height 1.11 */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-[4.5rem] font-light text-black leading-[1.11] tracking-[-0.04em] mb-6"
        >
          <span className="font-light">Your </span>
          <span className="font-medium">birth time</span>
          <span className="font-light">, with divine precision</span>
        </motion.h1>

        {/* Subheading — 18px, text-black/50, max-w-2xl, centered */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg md:text-xl text-black/50 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          AI-powered birth time rectification within seconds-level precision.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Primary CTA — rounded-[30px] bg-[#D9D9D9] text-black/85 */}
          <Link
            href="/rectify"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#D9D9D9] text-black/85 rounded-[30px] text-base font-medium hover:bg-black hover:text-white transition-all duration-200"
          >
            Start Your Analysis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Secondary link — ChevronDown */}
          <Link
            href="/#how-it-works"
            className="inline-flex items-center gap-2 px-8 py-4 text-black/60 hover:text-black transition-colors"
          >
            See how it works
            <ChevronDown className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Stats Bar — 3 stats with icons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8"
        >
          {HERO_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-black/30" />
                <div className="text-left">
                  <div className="text-lg font-medium text-black">{stat.value}</div>
                  <div className="text-sm text-black/40">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Scroll Indicator — bouncing dot in rounded-full border container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-black/20 rounded-full flex justify-center pt-2"
        >
          <div className="w-1.5 h-1.5 bg-black/40 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT — How It Works Section (id="how-it-works")
   Two-column: feature accordion (60%) + sticky browser mockup (40%)
   ═══════════════════════════════════════════════════════════════════════════════ */

function HowItWorks() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section id="how-it-works" className="relative py-32 bg-[#FAFAFA]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section Header */}
        <motion.div {...fadeIn} className="text-center mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full text-xs font-medium text-black/60 uppercase tracking-wider mb-6">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-black leading-[1.1] tracking-[-0.04em]">
            Six stages to your true birth time
          </h2>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
          {/* Left Side — Feature List (60% = 3/5 cols) */}
          <div className="lg:col-span-3 space-y-2">
            {FEATURES_LIST.map((feature, index) => (
              <motion.div
                key={feature.number}
                {...staggerItem}
                transition={{ ...staggerItem.transition, delay: index * 0.1 }}
                className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                  activeFeature === index
                    ? 'bg-white shadow-lg border border-black/5'
                    : 'hover:bg-white/50'
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <div className="flex items-start gap-4">
                  {/* Number — font-mono, active=black, inactive=black/30 */}
                  <span className={`text-sm font-mono font-medium mt-1 ${
                    activeFeature === index ? 'text-black' : 'text-black/30'
                  }`}>
                    {feature.number}
                  </span>
                  <div className="flex-1">
                    {/* Title — active=black, inactive=black/50 */}
                    <h3 className={`text-lg font-medium mb-2 transition-colors duration-300 ${
                      activeFeature === index ? 'text-black' : 'text-black/50'
                    }`}>
                      {feature.title}
                    </h3>
                    {/* Description — animated expand on click */}
                    <AnimatePresence>
                      {activeFeature === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: [0.215, 0.61, 0.355, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="text-black/50 text-sm leading-relaxed pt-1">
                            {feature.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Side — Live Analysis Engine (40% = 2/5 cols) */}
          <motion.div
            {...scaleIn}
            className="lg:col-span-2 lg:sticky lg:top-32"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
              >
                {activeFeature === 0 && <EphemerisTable />}
                {activeFeature === 1 && <AIThinkingBox />}
                {activeFeature === 2 && <CandidateComparisonTable />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT — Features Section (id="features")
   2x3 card grid — rounded-3xl, hover effects, gradient borders
   ═══════════════════════════════════════════════════════════════════════════════ */

function Features() {
  return (
    <section id="features" className="relative py-32 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section Header */}
        <motion.div {...fadeIn} className="text-center mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full text-xs font-medium text-black/60 uppercase tracking-wider mb-6">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-black leading-[1.1] tracking-[-0.04em]">
            Powered by ancient<br />wisdom & modern AI
          </h2>
        </motion.div>

        {/* 2x3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRODUCT_CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                {...staggerItem}
                transition={{ ...staggerItem.transition, delay: index * 0.08 }}
                className="group relative bg-[#FAFAFA] rounded-[30px] p-8 hover:bg-white hover:shadow-lg border border-transparent hover:border-black/5 transition-all duration-500 hover:-translate-y-0.5"
              >
                {/* Tag + Icon row */}
                <div className="flex items-start justify-between mb-6">
                  {/* Tag pill — colored bg at 15% opacity */}
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider"
                    style={{ backgroundColor: `${card.color}15`, color: card.color }}
                  >
                    {card.tag}
                  </span>
                  {/* Icon — 48x48 rounded-2xl, colored bg at 15% */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${card.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: card.color }} />
                  </div>
                </div>

                {/* Title + Description */}
                <h3 className="text-2xl font-medium text-black mb-3">{card.title}</h3>
                <p className="text-black/50 leading-relaxed">{card.description}</p>

                {/* Hover gradient border — linear gradient at 20% opacity */}
                <div
                  className="absolute inset-0 rounded-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, ${card.color}20 0%, transparent 50%)`,
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT — Privacy Section
   Dashed border box, lock icon, toggle pills, privacy description
   ═══════════════════════════════════════════════════════════════════════════════ */

function Privacy() {
  return (
    <section className="relative py-32 bg-[#FAFAFA]">
      <div className="max-w-[800px] mx-auto px-6">
        <motion.div {...fadeIn} className="text-center">
          {/* Dashed border box */}
          <div className="relative inline-block p-12 rounded-3xl border-2 border-dashed border-black/10">
            {/* Lock icon — scale-in animation */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-black/5 flex items-center justify-center"
            >
              <LockIcon className="w-8 h-8 text-black/40" />
            </motion.div>

            {/* Heading — 50px font-light */}
            <h2 className="text-4xl md:text-5xl font-light text-black leading-[1.1] tracking-[-0.04em] mb-4">
              Privacy first
            </h2>
            {/* Subheading — 30px weight 300 text-black/30 */}
            <p className="text-2xl md:text-3xl font-light text-black/30 mb-8">
              with you in control
            </p>

            {/* Toggle Pills — flex-wrap, justify-center, gap-3 */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {PRIVACY_FEATURES.map((feature) => (
                <div
                  key={feature.label}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    feature.active
                      ? 'bg-black text-white'
                      : 'bg-black/5 text-black/40'
                  }`}
                >
                  {/* Dot indicator — green=on, gray=off */}
                  <span className={`w-2 h-2 rounded-full ${feature.active ? 'bg-green-400' : 'bg-black/20'}`} />
                  {feature.label}
                  <span className="text-xs opacity-60">
                    {feature.active ? 'On' : 'Off'}
                  </span>
                </div>
              ))}
            </div>

            {/* Description — text-black/40, max-w-md */}
            <p className="text-black/40 max-w-md mx-auto mb-8 leading-relaxed">
              Your birth data is encrypted with AES-256-GCM before it leaves your browser.
              Each user gets a unique encryption key — we cannot read your data.
            </p>

            {/* Learn more link — pill button bg-black/5 */}
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black/5 hover:bg-black/10 rounded-full text-sm font-medium text-black/60 hover:text-black transition-all duration-300"
            >
              Learn more about privacy
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT — CTA Section
   Centered heading + pebble-gray button + free subtext
   ═══════════════════════════════════════════════════════════════════════════════ */

function CTA() {
  return (
    <section className="relative py-32 bg-white">
      <div className="max-w-[800px] mx-auto px-6 text-center">
        <motion.div {...fadeIn}>
          {/* Heading — 50px+ font-light */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-black leading-[1.1] tracking-[-0.04em] mb-8">
            Ready for a better<br />birth time?
          </h2>

          {/* Primary CTA — rounded-[30px] bg-[#D9D9D9] text-black/85 */}
          <Link
            href="/rectify"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-[#D9D9D9] text-black/85 rounded-[30px] text-lg font-medium hover:bg-black hover:text-white transition-all duration-200 mb-6"
          >
            Start Your Analysis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Subtext — text-black/30 text-sm */}
          <p className="text-black/30 text-sm">
            Free analysis. No credit card required.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE — Assembles all 5 sections in order
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <Navbar transparent />
      <Hero />
      <HowItWorks />
      <Features />
      <Privacy />
      <CTA />
      <Footer />
    </main>
  );
}
