/**
 * AI Pandit — New Landing Page
 * Built with Prism Design System
 * 100% Transparent — Real Tech Stack, Real Features
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Clock,
  Shield,
  Sparkles,
  Lock,
  Server,
  Database,
  Brain,
  Telescope,
  Zap,
  ChevronDown,
  Check,
  Github,
} from 'lucide-react';
import '@/app/prism-design-system.css';
import AIThinkingBox from '@/components/landing/AIThinkingBox';
import EphemerisTable from '@/components/landing/EphemerisTable';
import CandidateComparisonTable from '@/components/landing/CandidateComparisonTable';

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: 'easeOut' },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

/* ═══════════════════════════════════════════════════════════════════════════════
   DATA — 100% REAL PROJECT INFO
   ═══════════════════════════════════════════════════════════════════════════════ */

const CORE_STATS = [
  { value: 'Seconds', label: 'Precision', icon: Clock, color: '#c679c4' },
  { value: '97%+', label: 'Confidence', icon: Sparkles, color: '#fa3d1d' },
  { value: '~1 Hour', label: 'Analysis Time', icon: Zap, color: '#ffb005' },
];

const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    title: 'Enter Birth Details',
    description:
      'Share your birth date, approximate time, and location. Our system accepts rough estimates — even "sometime in the afternoon" is enough to start.',
    details: ['Date of birth', 'Approximate time range', 'Birth location'],
  },
  {
    number: '02',
    title: 'Describe Physical Traits',
    description:
      'Answer questions about your natural body type, height, build, and distinguishing features. These forensic markers help narrow the birth time window.',
    details: ['Body type analysis', 'Height & build', 'Distinguishing marks'],
  },
  {
    number: '03',
    title: 'Add Life Events',
    description:
      'Provide 3+ significant life events with dates — marriage, career milestones, relocations, health events. More precise dates = more accurate results.',
    details: ['Marriage, career, moves', 'Health events', 'Education milestones'],
  },
  {
    number: '04',
    title: 'AI Analysis & Results',
    description:
      'Our 6-stage pipeline cross-references your data against NASA JPL ephemeris positions using Vedic Dasha, Transit, KP Sublords, and Shadbala methods.',
    details: ['6-stage BTR pipeline', 'Real-time SSE progress', 'Seconds-level precision'],
  },
];

const TECH_STACK = [
  {
    category: 'Frontend',
    icon: Sparkles,
    items: [
      { name: 'Next.js 15', desc: 'App Router, React Server Components' },
      { name: 'React 18', desc: 'Concurrent features, Suspense' },
      { name: 'TypeScript', desc: 'Strict mode, 96.5% type coverage' },
      { name: 'Tailwind CSS', desc: 'Utility-first styling' },
      { name: 'Framer Motion', desc: 'Animations & transitions' },
      { name: 'Zustand', desc: 'Lightweight state management' },
    ],
  },
  {
    category: 'Backend',
    icon: Server,
    items: [
      { name: 'Node.js 20+', desc: 'Express.js API server' },
      { name: 'TypeScript', desc: 'Strict type safety' },
      { name: 'Drizzle ORM', desc: 'Type-safe SQL queries' },
      { name: 'Zod', desc: 'Runtime schema validation' },
      { name: 'Pino', desc: 'Structured logging' },
      { name: 'Helmet', desc: 'Security headers' },
    ],
  },
  {
    category: 'Database & Cache',
    icon: Database,
    items: [
      { name: 'Neon Postgres', desc: 'Serverless PostgreSQL' },
      { name: 'Upstash Redis', desc: 'Queue & cache layer' },
      { name: 'Drizzle Kit', desc: 'Migrations & schema management' },
    ],
  },
  {
    category: 'AI & Ephemeris',
    icon: Brain,
    items: [
      { name: 'DeepSeek AI', desc: 'R1-0528 reasoning model' },
      { name: 'Groq API', desc: 'Ultra-fast LLM inference' },
      { name: 'Python Skyfield', desc: 'NASA JPL ephemeris data' },
      { name: 'Vedic Engine', desc: 'Parashara, Dasha, KP, Shadbala' },
    ],
  },
  {
    category: 'Security',
    icon: Lock,
    items: [
      { name: 'AES-256-GCM', desc: 'End-to-end encryption' },
      { name: 'Clerk Auth', desc: 'Authentication & sessions' },
      { name: 'Per-user keys', desc: 'Unique encryption per user' },
    ],
  },
  {
    category: 'Deployment',
    icon: Telescope,
    items: [
      { name: 'Google Cloud Run', desc: 'Containerized services' },
      { name: 'Turborepo', desc: 'Monorepo management' },
      { name: 'Vitest', desc: 'Testing framework' },
    ],
  },
];

const FEATURES = [
  {
    icon: Clock,
    title: 'Seconds-Level Precision',
    description:
      'Traditional BTR methods give you a 2-4 minute window. Our 6-stage pipeline narrows it down to seconds by cross-referencing multiple Vedic techniques.',
  },
  {
    icon: Brain,
    title: '6-Stage Analysis Pipeline',
    description:
      'Dasha periods, Transit analysis, KP Sublords, Shadbala strength, Physical trait correlation, and Event validation — all working together.',
  },
  {
    icon: Zap,
    title: 'Real-Time Progress Streaming',
    description:
      'Watch the analysis unfold live with Server-Sent Events (SSE). See which stage is running, candidate scores, and confidence levels in real-time.',
  },
  {
    icon: Lock,
    title: 'AES-256 Encryption',
    description:
      'Your birth data is encrypted before it leaves your browser. Each user gets a unique encryption key derived from their identity — we cannot read your data.',
  },
  {
    icon: Telescope,
    title: 'NASA JPL Ephemeris',
    description:
      'Planetary positions are calculated using Skyfield with NASA JPL DE440 ephemeris data — the same data used by space agencies. Sub-arcsecond accuracy.',
  },
  {
    icon: Shield,
    title: 'Multiple Validation Layers',
    description:
      'Every result is validated against historical gold datasets, ephemeris parity checks, and deterministic smoke tests before reaching you.',
  },
];

const FAQS = [
  {
    q: 'How accurate is the birth time rectification?',
    a: 'Our system achieves seconds-level precision by running a 6-stage pipeline that cross-references Vimshottari Dasha periods, Transit analysis, KP Sublords, Shadbala strength, physical trait correlation, and life event validation against NASA JPL ephemeris data. Traditional methods typically give a 2-4 minute window.',
  },
  {
    q: 'What tech stack powers this platform?',
    a: 'We are 100% transparent: Next.js 15 + React 18 frontend, Express.js + TypeScript backend, Neon Postgres database, Upstash Redis for queues, Python Skyfield for astronomical calculations (NASA JPL DE440 ephemeris), DeepSeek AI R1-0528 for reasoning, and Groq API for fast inference. All code is TypeScript strict mode.',
  },
  {
    q: 'Is my birth data safe and private?',
    a: 'Yes. Your data is encrypted with AES-256-GCM before it leaves your browser. Each user gets a unique encryption key derived from their Clerk identity — even our team cannot decrypt your data. We never share information with third parties. Birth data is sacred, and we treat it that way.',
  },
  {
    q: 'How many life events do I need to provide?',
    a: 'At least 3 significant events with reasonably accurate dates work best. Events like marriage, first job, graduation, major relocation, or health milestones provide strong signals. The more precise your dates, the more accurate the rectification.',
  },
  {
    q: 'Do I need astrology knowledge to use this?',
    a: 'Not at all. The system handles all astrological calculations automatically. You just need to know your birth details and a few life events. No prior knowledge of Jyotish, Dasha, or KP system is required.',
  },
  {
    q: 'What makes this different from other BTR tools?',
    a: 'Three things: (1) Seconds-level precision vs. minutes in traditional methods, (2) A transparent 6-stage validation pipeline with real-time progress, (3) Open tech stack — we show you exactly what algorithms and data sources we use, including NASA JPL ephemeris and DeepSeek AI.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT SECTIONS
   ═══════════════════════════════════════════════════════════════════════════════ */

function Header() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-prism-fog/90 backdrop-blur-prism-lg border-b transition-colors duration-200 ${
        scrolled ? 'border-prism-pebble' : 'border-transparent'
      }`}
      style={{ WebkitBackdropFilter: 'blur(24px)' }}
    >
      <div className="prism-container flex items-center justify-between h-[3.25rem]">
        <Link href="/" className="font-prism text-lg font-medium text-prism-ink tracking-tight">
          AI Pandit
        </Link>

        <nav className="hidden md:flex items-center gap-prism-6">
          {[
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Tech Stack', href: '#tech-stack' },
            { label: 'Features', href: '#features' },
            { label: 'FAQ', href: '#faq' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-prism-body-sm font-normal text-prism-ink transition-colors duration-200 hover:text-prism-graphite"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link href="/rectify" className="prism-btn text-sm">
          Begin Analysis
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Spectrum gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] prism-gradient-spectrum opacity-[0.08] blur-[120px] rounded-full pointer-events-none" />

      <div className="prism-container pt-prism-14 pb-prism-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            {...fadeInUp}
            className="inline-flex items-center gap-prism-3 px-prism-6 py-prism-3 bg-prism-fog rounded-prism-md mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-prism-signal-blue animate-pulse" />
            <span className="text-prism-body-sm font-medium text-prism-ink">
              Vedic Birth Time Rectification
            </span>
            <span className="text-prism-caption text-prism-slate hidden sm:inline">
              NASA JPL • DeepSeek AI • Skyfield
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.05 }}
            className="font-prism font-light text-prism-ink text-[2.25rem] md:text-[4.5rem] leading-[1.11] tracking-[-0.04em]"
          >
            Discover Your{' '}
            <span className="prism-gradient-spectrum bg-clip-text text-transparent">
              Exact Birth Time
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.1 }}
            className="mt-6 text-lg font-normal text-prism-graphite max-w-2xl mx-auto leading-relaxed"
          >
            AI-powered birth time rectification within{' '}
            <span className="text-prism-ink font-medium">seconds-level precision</span>.
            Powered by NASA JPL ephemeris data, DeepSeek AI reasoning, and classical
            Vedic astrology principles.
          </motion.p>

          {/* CTA */}
          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.15 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/rectify" className="prism-btn">
              Begin Your Journey
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#tech-stack"
              className="prism-btn-ghost text-sm"
            >
              See The Tech Stack
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.2 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-prism-8"
          >
            {CORE_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-prism-3">
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  <div className="text-left">
                    <div className="font-prism text-lg font-medium text-prism-ink">
                      {stat.value}
                    </div>
                    <div className="text-prism-caption text-prism-slate">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Security badge */}
          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.25 }}
            className="mt-8 flex justify-center"
          >
            <div className="inline-flex items-center gap-prism-3 px-prism-5 py-prism-3 bg-prism-fog rounded-prism-lg">
              <Lock className="w-4 h-4 text-prism-graphite" />
              <span className="text-prism-body-sm text-prism-graphite">
                AES-256-GCM Encryption • Per-User Keys • Zero-Knowledge Architecture
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function LiveAnalysisEngine() {
  return (
    <section className="prism-section bg-prism-canvas">
      <div className="prism-container">
        <motion.div {...fadeInUp} className="text-center mb-prism-8">
          <div className="inline-flex items-center gap-2 px-prism-4 py-prism-2 bg-prism-fog rounded-prism-full mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-prism-caption font-medium text-prism-graphite uppercase tracking-wider">
              Live Analysis Engine
            </span>
          </div>
          <h2 className="font-prism font-light text-[2.5rem] leading-[1.15] tracking-[-0.03em] text-prism-ink">
            See the Analysis in Action
          </h2>
          <p className="mt-3 text-prism-body font-normal text-prism-graphite max-w-xl mx-auto">
            A real-time glimpse into how our 6-stage pipeline processes your birth data
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-prism-6 max-w-5xl mx-auto">
          <motion.div {...staggerItem} transition={{ delay: 0.1 }}>
            <AIThinkingBox />
          </motion.div>
          <motion.div {...staggerItem} transition={{ delay: 0.2 }}>
            <EphemerisTable />
          </motion.div>
          <motion.div {...staggerItem} transition={{ delay: 0.3 }}>
            <CandidateComparisonTable />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="prism-section bg-prism-canvas">
      <div className="prism-container">
        <motion.div {...fadeInUp} className="text-center mb-prism-12">
          <h2 className="font-prism font-light text-[3.125rem] leading-[1.11] tracking-[-0.04em] text-prism-ink">
            How It Works
          </h2>
          <p className="mt-4 text-lg font-normal text-prism-graphite max-w-xl mx-auto">
            Four simple steps to discover your precise birth time
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-prism-6">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <motion.div
              key={step.number}
              {...staggerItem}
              className="prism-card-sm flex flex-col"
            >
              <span className="text-[3rem] font-light text-prism-pebble leading-none mb-prism-4">
                {step.number}
              </span>
              <h3 className="font-prism text-[1.375rem] font-medium text-prism-ink leading-[1.25] mb-2">
                {step.title}
              </h3>
              <p className="text-prism-body-sm font-normal text-prism-graphite leading-relaxed mb-prism-6 flex-grow">
                {step.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {step.details.map((detail) => (
                  <span
                    key={detail}
                    className="inline-flex items-center gap-1 text-prism-caption text-prism-slate bg-prism-fog px-prism-3 py-prism-2 rounded-prism-full"
                  >
                    <Check className="w-3 h-3" />
                    {detail}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TechStack() {
  return (
    <section id="tech-stack" className="prism-section-lg">
      <div className="prism-container">
        <motion.div {...fadeInUp} className="text-center mb-prism-12">
          <div className="inline-flex items-center gap-2 px-prism-4 py-prism-2 bg-prism-fog rounded-prism-full mb-4">
            <Github className="w-4 h-4 text-prism-graphite" />
            <span className="text-prism-caption font-medium text-prism-graphite uppercase tracking-wider">
              100% Transparent
            </span>
          </div>
          <h2 className="font-prism font-light text-[3.125rem] leading-[1.11] tracking-[-0.04em] text-prism-ink">
            Our Tech Stack
          </h2>
          <p className="mt-4 text-lg font-normal text-prism-graphite max-w-2xl mx-auto">
            We believe in complete transparency. Here is every technology that powers AI Pandit —
            no black boxes, no hidden vendors.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-prism-6">
          {TECH_STACK.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.category}
                {...staggerItem}
                transition={{ ...staggerItem.transition, delay: index * 0.05 }}
                className="prism-card-sm"
              >
                <div className="flex items-center gap-prism-3 mb-prism-6">
                  <div className="w-10 h-10 rounded-prism-md bg-prism-fog flex items-center justify-center">
                    <Icon className="w-5 h-5 text-prism-ink" />
                  </div>
                  <h3 className="font-prism text-lg font-medium text-prism-ink">
                    {category.category}
                  </h3>
                </div>
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <div key={item.name} className="flex items-start gap-prism-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-prism-pebble mt-2 flex-shrink-0" />
                      <div>
                        <span className="text-prism-body-sm font-medium text-prism-ink">
                          {item.name}
                        </span>
                        <span className="text-prism-caption text-prism-slate ml-2">
                          {item.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Architecture diagram */}
        <motion.div {...fadeInUp} className="mt-prism-12">
          <div className="prism-card p-prism-8">
            <h3 className="font-prism text-[1.375rem] font-medium text-prism-ink mb-prism-6 text-center">
              System Architecture
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
              {[
                { layer: 'Frontend', tech: 'Next.js 15', desc: 'React 18 + Tailwind' },
                { layer: 'API', tech: 'Express.js', desc: 'TypeScript + Drizzle' },
                { layer: 'Worker', tech: 'Background Jobs', desc: 'Redis Queue' },
                { layer: 'Database', tech: 'Neon Postgres', desc: 'Serverless SQL' },
                { layer: 'Ephemeris', tech: 'Python Skyfield', desc: 'NASA JPL DE440' },
              ].map((item) => (
                <div
                  key={item.layer}
                  className="p-4 bg-prism-fog/50 rounded-prism-lg"
                >
                  <div className="text-prism-caption text-prism-slate uppercase tracking-wider mb-1">
                    {item.layer}
                  </div>
                  <div className="text-prism-body-sm font-medium text-prism-ink">
                    {item.tech}
                  </div>
                  <div className="text-prism-caption text-prism-slate">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="prism-section bg-prism-canvas">
      <div className="prism-container">
        <motion.div {...fadeInUp} className="text-center mb-prism-12">
          <h2 className="font-prism font-light text-[3.125rem] leading-[1.11] tracking-[-0.04em] text-prism-ink">
            What Makes Us Different
          </h2>
          <p className="mt-4 text-lg font-normal text-prism-graphite max-w-xl mx-auto">
            Not just another astrology tool. Built with engineering rigor and scientific precision.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-prism-6">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                {...staggerItem}
                transition={{ ...staggerItem.transition, delay: index * 0.05 }}
                className="prism-card-sm hover:-translate-y-0.5 transition-transform duration-200"
              >
                <div className="w-10 h-10 rounded-prism-md bg-prism-fog flex items-center justify-center mb-prism-5">
                  <Icon className="w-5 h-5 text-prism-ink" />
                </div>
                <h3 className="font-prism text-lg font-medium text-prism-ink mb-2">
                  {feature.title}
                </h3>
                <p className="text-prism-body-sm font-normal text-prism-graphite leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="prism-section">
      <div className="prism-container max-w-3xl">
        <motion.div {...fadeInUp} className="text-center mb-prism-12">
          <h2 className="font-prism font-light text-[3.125rem] leading-[1.11] tracking-[-0.04em] text-prism-ink">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => (
            <motion.details
              key={index}
              {...staggerItem}
              transition={{ ...staggerItem.transition, delay: index * 0.05 }}
              className="group bg-white/90 backdrop-blur-prism-lg rounded-prism-xl shadow-prism-sm overflow-hidden border-none"
              style={{ WebkitBackdropFilter: 'blur(24px)' }}
            >
              <summary className="px-prism-6 py-prism-5 text-prism-ink font-medium cursor-pointer flex items-center justify-between hover:bg-prism-fog/50 transition-colors list-none text-prism-body">
                <span className="pr-4">{faq.q}</span>
                <ChevronDown className="w-4 h-4 text-prism-slate flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="border-t border-prism-fog px-prism-6 py-prism-5 text-prism-body-sm text-prism-graphite leading-relaxed">
                {faq.a}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="prism-section-lg relative overflow-hidden">
      {/* Spectrum glow */}
      <div className="absolute inset-0 prism-gradient-spectrum opacity-[0.06] blur-[100px] pointer-events-none" />

      <div className="prism-container relative">
        <motion.div {...fadeInUp} className="text-center max-w-2xl mx-auto">
          <h2 className="font-prism font-light text-[3.125rem] leading-[1.11] tracking-[-0.04em] text-prism-ink">
            Ready to discover your exact birth time?
          </h2>
          <p className="mt-4 text-lg font-normal text-prism-graphite mb-8">
            Join thousands who have found their precise birth moment through AI-powered
            Vedic astrology. Your data stays encrypted. Your results are seconds-accurate.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/rectify" className="prism-btn text-base px-prism-8 py-prism-5">
              Begin Free Analysis
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-prism-pebble bg-prism-canvas">
      <div className="prism-container py-prism-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-prism-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <span className="font-prism text-2xl font-medium text-prism-ink block mb-2">
              AI Pandit
            </span>
            <span className="text-prism-caption text-prism-slate uppercase tracking-wider">
              AI-Powered Vedic Birth Time Rectification
            </span>
            <p className="mt-4 text-prism-body-sm text-prism-graphite leading-relaxed max-w-sm">
              Birth time rectification within seconds-level precision using NASA JPL
              ephemeris data, DeepSeek AI reasoning, and classical Vedic astrology.
              Built with transparency. Encrypted by default.
            </p>
            <div className="mt-4 flex items-center gap-2 text-prism-caption text-prism-slate">
              <span>Built with</span>
              <span className="text-red-400">♥</span>
              <span>and scientific rigor</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-prism text-sm font-medium text-prism-ink mb-4">Product</h4>
            <ul className="space-y-2">
              {[
                { label: 'Start Analysis', href: '/rectify' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Tech Stack', href: '#tech-stack' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-prism-body-sm text-prism-graphite hover:text-prism-ink hover:underline underline-offset-[0.15em] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-prism text-sm font-medium text-prism-ink mb-4">Legal</h4>
            <ul className="space-y-2">
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-prism-body-sm text-prism-graphite hover:text-prism-ink hover:underline underline-offset-[0.15em] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-prism-pebble mt-prism-10 pt-prism-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-prism-body-sm text-prism-slate">
            © {currentYear} AI Pandit. All rights reserved.
          </p>
          <div className="flex items-center gap-prism-4">
            <span className="text-prism-caption text-prism-slate">Powered by</span>
            <div className="flex items-center gap-prism-3">
              {['Next.js', 'DeepSeek AI', 'Skyfield', 'Neon'].map((tech, i) => (
                <React.Fragment key={tech}>
                  <span className="text-prism-caption text-prism-graphite">{tech}</span>
                  {i < 3 && <span className="text-prism-pebble">•</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-prism-canvas font-prism antialiased">
      <Header />
      <Hero />
      <LiveAnalysisEngine />
      <HowItWorks />
      <TechStack />
      <Features />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
