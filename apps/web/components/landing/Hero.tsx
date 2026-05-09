/**
 * Hero Section - Sacred Ivory Edition
 * Soothing light theme with divine typography
 */
'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Play,
  Clock,
  Target,
  Sparkles,
  ChevronDown
} from 'lucide-react';

import dynamic from 'next/dynamic';

const AIThinkingBox = dynamic(() => import('./AIThinkingBox'), { ssr: false });
const EphemerisTable = dynamic(() => import('./EphemerisTable'), { ssr: false });
const CandidateComparisonTable = dynamic(() => import('./CandidateComparisonTable'), { ssr: false });

// Core stats with warm colors
const coreStats = [
  {
    value: 'Within Seconds',
    label: 'Precision',
    icon: Target,
    desc: 'Exact birth time',
    color: '#000000'
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
  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
          <div
            className="animate-scale-in inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ffffff] to-white
                       border border-[rgba(0,0,0,0.08)] rounded-full text-sm mb-8"
          >
            <span className="text-[#6B1F7A] font-medium">Vedic Birth Time Rectification</span>
            <span className="text-[10px] px-2 py-0.5 bg-[#000000]/10 text-[#8A6A0B] rounded-full">by Skyfield Ephemeris</span>
            <span className="text-[10px] px-2 py-0.5 bg-[#4A7C6F]/10 text-[#3A6C5F] rounded-full">by DeepSeek R1-0528</span>
          </div>

          {/* Main Headline - Elegant Typography */}
          <div
            className="animate-fade-in-up mb-6"
            style={{ animationDelay: '0.1s' }}
          >
            <h1 className=" text-4xl sm:text-5xl lg:text-6xl xl:text-7xl
                           font-medium text-black leading-tight tracking-tight">
              Discover Your{' '}
              <span className="text-black">Exact Birth Time</span>
            </h1>
            <p className="mt-4 text-lg text-[#636363] font-light italic">
              by <span className=" text-2xl text-[#8A6A0B] font-medium not-italic">AI Pandit</span>
            </p>
          </div>

          {/* Subtitle */}
          <p
            className="animate-fade-in-up text-lg sm:text-xl text-[#636363] mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ animationDelay: '0.2s' }}
          >
            Highly accurate birth time rectification within{' '}
            <span className="text-[#8A6A0B] font-medium">seconds-level precision</span>.
            Powered by Skyfield astronomical data and DeepSeek AI,
            aligned with ancient Vedic wisdom.
          </p>

          {/* CTA Buttons */}
          <div
            className="animate-fade-in-up flex flex-col sm:flex-row gap-4 justify-center mb-8"
            style={{ animationDelay: '0.3s' }}
          >
            <Link href="/rectify"
              className="group relative px-10 py-4 bg-gradient-to-r from-[#000000] via-[#000000] to-[#E5C880]
                         text-white font-medium text-base rounded-xl
                         overflow-hidden transition-all duration-300 hover:brightness-105 active:brightness-95 inline-block"
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Begin Your Journey
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                                translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Link>
          </div>

          {/* Core Stats - Horizontal Inline Layout */}
          <div className="flex flex-wrap items-center justify-center gap-6 max-w-2xl mx-auto mb-8">
            {coreStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="animate-fade-in-up flex items-center gap-3"
                  style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" style={{ color: stat.color }} />
                  <div className="text-left">
                    <div className=" text-lg sm:text-xl font-medium text-black">
                      {stat.value}
                    </div>
                    <div className="text-[11px] text-[#636363]">{stat.label}</div>
                  </div>
                  {index < coreStats.length - 1 && (
                    <div className="hidden sm:block w-px h-8 bg-[rgba(0,0,0,0.08)] ml-3" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Security Badge */}
          <div
            className="animate-fade-in-up flex justify-center"
            style={{ animationDelay: '0.6s' }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/[0.03] border border-black/5 rounded-full">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black/40">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span className="text-xs text-black/40">Encrypted & private</span>
            </div>
          </div>
          <div
            className="animate-fade-in-up flex justify-center"
            style={{ animationDelay: '0.6s' }}
          >
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <SecurityShieldIcon />
              <div className="text-left">
                <div className="text-sm font-medium text-emerald-800">Your Data is Protected</div>
                <div className="text-xs text-emerald-700">End-to-End Encrypted</div>
              </div>
            </div>
          </div>
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
              <span className="text-sm font-medium text-black">Live Analysis Engine</span>
            </div>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#000000] text-black
                         text-sm rounded-lg hover:bg-[#ffffff] transition-colors"
            >
              <Play className="w-4 h-4" />
              See How It Works
            </button>
          </div>

          {/* Analysis Components */}
          <AIThinkingBox />
          <EphemerisTable />
          <CandidateComparisonTable />
        </div>

        {/* Scroll Indicator */}
        <div className="flex justify-center mt-16">
          <div
            className="animate-gentle-float flex flex-col items-center gap-2 text-[#959595]"
          >
            <span className="text-xs uppercase tracking-[0.2em]">Scroll to explore</span>
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </div>
    </section>
  );
}
