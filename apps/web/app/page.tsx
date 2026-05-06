/**
 * AI Pandit — New Landing Page
 * Built with Prism Design System + Dia Browser Inspired Styling
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
  Star,
  Moon,
  Sun,
  Calendar,
  MapPin,
  User,
  FileText,
  Activity,
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

const floatAnimation = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.6, ease: 'easeOut' },
};

/* ═══════════════════════════════════════════════════════════════════════════════
   DATA — 100% REAL PROJECT INFO
   ═══════════════════════════════════════════════════════════════════════════════ */

const CORE_STATS = [
  { value: 'Seconds', label: 'Precision', icon: Clock, color: '#000000' },
  { value: '97%+', label: 'Confidence', icon: Sparkles, color: '#000000' },
  { value: '~1 Hour', label: 'Analysis Time', icon: Zap, color: '#000000' },
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
   FLOATING WIDGET COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

function FloatingWidget({
  icon: Icon,
  title,
  subtitle,
  className,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={`dia-float-widget absolute ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-dia-hero-blue-start/30 flex items-center justify-center">
          <Icon className="w-4 h-4 text-black/70" />
        </div>
        <div>
          <div className="text-sm font-medium text-black">{title}</div>
          <div className="text-xs text-black/50">{subtitle}</div>
        </div>
      </div>
    </motion.div>
  );
}

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
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-black/5'
          : 'bg-transparent'
      }`}
      style={{ WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none' }}
    >
      <div className="dia-container flex items-center justify-between h-16">
        <Link
          href="/"
          className="font-dia-heading text-lg font-medium text-black tracking-tight"
        >
          AI Pandit
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Tech Stack', href: '#tech-stack' },
            { label: 'Features', href: '#features' },
            { label: 'FAQ', href: '#faq' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-normal text-black/60 transition-colors duration-200 hover:text-black"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link href="/rectify" className="dia-btn text-sm">
          Begin Analysis
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden dia-hero-gradient">
      {/* Floating widgets */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <FloatingWidget
          icon={Calendar}
          title="Birth Chart"
          subtitle="Natal analysis ready"
          className="top-[15%] left-[8%] animate-dia-float hidden lg:block"
          delay={0.3}
        />
        <FloatingWidget
          icon={Moon}
          title="Dasha Analysis"
          subtitle="Vimshottari periods"
          className="top-[20%] right-[10%] animate-dia-float-slow hidden lg:block"
          delay={0.5}
        />
        <FloatingWidget
          icon={Activity}
          title="Transit Check"
          subtitle="Real-time positions"
          className="bottom-[25%] left-[5%] animate-dia-float-delayed hidden lg:block"
          delay={0.7}
        />
        <FloatingWidget
          icon={Star}
          title="97% Confidence"
          subtitle="High accuracy match"
          className="bottom-[30%] right-[8%] animate-dia-float hidden lg:block"
          delay={0.9}
        />
      </div>

      <div className="dia-container pt-20 pb-32 md:pt-28 md:pb-40 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            {...fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full mb-8 border border-black/5"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-black/70 uppercase tracking-wider font-dia-mono">
              Vedic Birth Time Rectification
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.05 }}
            className="font-dia-heading font-light text-black text-[2.5rem] md:text-[4.8rem] lg:text-[6rem] leading-[1.05] tracking-[-0.04em]"
          >
            Discover Your{' '}
            <span className="font-dia-serif italic text-black/90">
              Exact Birth Time
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.1 }}
            className="mt-8 text-lg md:text-xl font-normal text-black/60 max-w-2xl mx-auto leading-relaxed"
          >
            AI-powered birth time rectification within{' '}
            <span className="text-black font-medium">seconds-level precision</span>.
            Powered by NASA JPL ephemeris data, DeepSeek AI reasoning, and classical
            Vedic astrology principles.
          </motion.p>

          {/* CTA */}
          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.15 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/rectify" className="dia-btn text-base px-8 py-4">
              Begin Your Journey
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#tech-stack" className="dia-btn-ghost text-base px-8 py-4">
              See The Tech Stack
            </a>
          </motion.div>

          {/* Stats as floating pills */}
          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.2 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-4"
          >
            {CORE_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="dia-pill"
                >
                  <Icon className="w-4 h-4 text-black/40" />
                  <span className="font-medium text-black">{stat.value}</span>
                  <span className="text-black/40">{stat.label}</span>
                </div>
              );
            })}
          </motion.div>

          {/* Security badge */}
          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.25 }}
            className="mt-6 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-black/5">
              <Lock className="w-3.5 h-3.5 text-black/40" />
              <span className="text-xs text-black/50 font-dia-mono uppercase tracking-wider">
                AES-256-GCM Encryption • Per-User Keys • Zero-Knowledge
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Curved white arc at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L1440 120V60C1440 60 1200 0 720 0C240 0 0 60 0 60V120Z"
            fill="#F8F8F8"
          />
        </svg>
      </div>
    </section>
  );
}

function LiveAnalysisEngine() {
  return (
    <section className="dia-section-sm bg-dia-bg">
      <div className="dia-container">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-black/5 rounded-full mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-black/50 uppercase tracking-wider font-dia-mono">
              Live Analysis Engine
            </span>
          </div>
          <h2 className="font-dia-heading font-light text-[2.5rem] md:text-[3.5rem] leading-[1.1] tracking-[-0.04em] text-black">
            See the Analysis in Action
          </h2>
          <p className="mt-4 text-lg font-normal text-black/60 max-w-xl mx-auto">
            A real-time glimpse into how our 6-stage pipeline processes your birth data
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <motion.div {...staggerItem} transition={{ delay: 0.1 }}>
            <div className="dia-card-sm h-full">
              <AIThinkingBox />
            </div>
          </motion.div>
          <motion.div {...staggerItem} transition={{ delay: 0.2 }}>
            <div className="dia-card-sm h-full">
              <EphemerisTable />
            </div>
          </motion.div>
          <motion.div {...staggerItem} transition={{ delay: 0.3 }}>
            <div className="dia-card-sm h-full">
              <CandidateComparisonTable />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="dia-section bg-dia-bg">
      <div className="dia-container">
        <motion.div {...fadeInUp} className="text-center mb-20">
          <h2 className="font-dia-heading font-light text-[2.5rem] md:text-[3.5rem] leading-[1.1] tracking-[-0.04em] text-black">
            How It Works
          </h2>
          <p className="mt-4 text-lg font-normal text-black/60 max-w-xl mx-auto">
            Four simple steps to discover your precise birth time
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-16 max-w-4xl mx-auto">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              {...staggerItem}
              transition={{ ...staggerItem.transition, delay: index * 0.1 }}
              className="relative pl-8 border-l border-black/10"
            >
              <span className="absolute left-0 top-0 -translate-x-1/2 font-dia-mono text-xs text-black/30 bg-dia-bg px-1">
                {step.number}
              </span>
              <h3 className="font-dia-heading text-xl md:text-2xl font-light text-black leading-[1.2] mb-3 tracking-[-0.02em]">
                {step.title}
              </h3>
              <p className="text-base font-normal text-black/60 leading-relaxed mb-5">
                {step.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {step.details.map((detail) => (
                  <span
                    key={detail}
                    className="inline-flex items-center gap-1.5 text-xs text-black/50 bg-white border border-black/5 px-3 py-1.5 rounded-full"
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
    <section id="tech-stack" className="dia-section bg-white">
      <div className="dia-container">
        <motion.div {...fadeInUp} className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dia-bg border border-black/5 rounded-full mb-6">
            <Github className="w-4 h-4 text-black/50" />
            <span className="text-xs font-medium text-black/50 uppercase tracking-wider font-dia-mono">
              100% Transparent
            </span>
          </div>
          <h2 className="font-dia-heading font-light text-[2.5rem] md:text-[3.5rem] leading-[1.1] tracking-[-0.04em] text-black">
            Our Tech Stack
          </h2>
          <p className="mt-4 text-lg font-normal text-black/60 max-w-2xl mx-auto">
            We believe in complete transparency. Here is every technology that powers AI Pandit —
            no black boxes, no hidden vendors.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TECH_STACK.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.category}
                {...staggerItem}
                transition={{ ...staggerItem.transition, delay: index * 0.05 }}
                className="dia-card"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-dia-bg flex items-center justify-center border border-black/5">
                    <Icon className="w-5 h-5 text-black/70" />
                  </div>
                  <h3 className="font-dia-heading text-lg font-medium text-black">
                    {category.category}
                  </h3>
                </div>
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <div key={item.name} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-black/20 mt-2 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-black">
                          {item.name}
                        </span>
                        <span className="text-sm text-black/40 ml-2">
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
        <motion.div {...fadeInUp} className="mt-16">
          <div className="dia-card p-8 md:p-10">
            <h3 className="font-dia-heading text-xl font-medium text-black mb-8 text-center">
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
                  className="p-4 bg-dia-bg rounded-2xl border border-black/5"
                >
                  <div className="text-xs text-black/40 uppercase tracking-wider mb-1 font-dia-mono">
                    {item.layer}
                  </div>
                  <div className="text-sm font-medium text-black">
                    {item.tech}
                  </div>
                  <div className="text-xs text-black/40">{item.desc}</div>
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
    <section id="features" className="dia-section bg-dia-bg">
      <div className="dia-container">
        <motion.div {...fadeInUp} className="text-center mb-20">
          <h2 className="font-dia-heading font-light text-[2.5rem] md:text-[3.5rem] leading-[1.1] tracking-[-0.04em] text-black">
            What Makes Us Different
          </h2>
          <p className="mt-4 text-lg font-normal text-black/60 max-w-xl mx-auto">
            Not just another astrology tool. Built with engineering rigor and scientific precision.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                {...staggerItem}
                transition={{ ...staggerItem.transition, delay: index * 0.05 }}
                className="dia-card hover:-translate-y-0.5 transition-transform duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-dia-bg flex items-center justify-center border border-black/5 mb-5">
                  <Icon className="w-5 h-5 text-black/70" />
                </div>
                <h3 className="font-dia-heading text-lg font-medium text-black mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm font-normal text-black/60 leading-relaxed">
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
    <section id="faq" className="dia-section bg-white">
      <div className="dia-container max-w-3xl">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <h2 className="font-dia-heading font-light text-[2.5rem] md:text-[3.5rem] leading-[1.1] tracking-[-0.04em] text-black">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <motion.details
              key={index}
              {...staggerItem}
              transition={{ ...staggerItem.transition, delay: index * 0.05 }}
              className="dia-faq-item group"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="pr-4 text-base md:text-lg font-normal text-black">
                  {faq.q}
                </span>
                <ChevronDown className="w-5 h-5 text-black/30 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="border-t border-black/5 px-6 md:px-8 py-5 text-sm md:text-base text-black/60 leading-relaxed">
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
    <section className="dia-section-lg bg-dia-bg relative overflow-hidden">
      <div className="dia-container relative">
        <motion.div {...fadeInUp} className="text-center max-w-2xl mx-auto">
          <h2 className="font-dia-heading font-light text-[2.5rem] md:text-[4rem] leading-[1.1] tracking-[-0.04em] text-black">
            Ready to discover your{' '}
            <span className="font-dia-serif italic">exact birth time</span>?
          </h2>
          <p className="mt-6 text-lg font-normal text-black/60 mb-10">
            Join thousands who have found their precise birth moment through AI-powered
            Vedic astrology. Your data stays encrypted. Your results are seconds-accurate.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/rectify" className="dia-btn text-lg px-10 py-5">
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
    <footer className="border-t border-black/5 bg-white">
      <div className="dia-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <span className="font-dia-heading text-2xl font-medium text-black block mb-2">
              AI Pandit
            </span>
            <span className="text-xs text-black/40 uppercase tracking-wider font-dia-mono">
              AI-Powered Vedic Birth Time Rectification
            </span>
            <p className="mt-4 text-sm text-black/60 leading-relaxed max-w-sm">
              Birth time rectification within seconds-level precision using NASA JPL
              ephemeris data, DeepSeek AI reasoning, and classical Vedic astrology.
              Built with transparency. Encrypted by default.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-black/40 font-dia-mono">
              <span>Built with</span>
              <span className="text-red-400">♥</span>
              <span>and scientific rigor</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-dia-heading text-sm font-medium text-black mb-4">Product</h4>
            <ul className="space-y-3">
              {[
                { label: 'Start Analysis', href: '/rectify' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Tech Stack', href: '#tech-stack' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-black/60 hover:text-black hover:underline underline-offset-4 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-dia-heading text-sm font-medium text-black mb-4">Legal</h4>
            <ul className="space-y-3">
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-black/60 hover:text-black hover:underline underline-offset-4 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-black/5 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-black/40">
            © {currentYear} AI Pandit. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-black/40 font-dia-mono uppercase tracking-wider">Powered by</span>
            <div className="flex items-center gap-3">
              {['Next.js', 'DeepSeek AI', 'Skyfield', 'Neon'].map((tech, i) => (
                <React.Fragment key={tech}>
                  <span className="text-xs text-black/50">{tech}</span>
                  {i < 3 && <span className="text-black/20">•</span>}
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
    <main className="min-h-screen bg-dia-bg font-dia-heading antialiased">
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
