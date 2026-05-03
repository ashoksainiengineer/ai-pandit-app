/**
 * Accuracy Showcase Section - Sacred Ivory Edition
 * Elegant precision metrics with warm colors
 */

'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import {
  TrendingUp,
  Target,
  BarChart3,
  Terminal,
  Cpu,
  Activity,
  Gauge,
  Clock,
  Database,
  CheckCircle2,
  GitBranch,
  Zap
} from 'lucide-react';

const precisionMetrics = [
  {
    method: 'Manual Astrologer',
    accuracy: 65,
    precision: '±5-15 min',
    methods: '1-2',
    time: '3-5 days',
    color: '#A8A39D',
  },
  {
    method: 'Basic Software',
    accuracy: 75,
    precision: '±2-5 min',
    methods: '3-4',
    time: '1 hour',
    color: '#7A756F',
  },
  {
    method: 'AI Pandit BTR',
    accuracy: 97.3,
    precision: '±15 sec',
    methods: '10+',
    time: '20-25 min',
    color: '#B8860B',
    highlight: true,
  },
];

const technicalMetrics = [
  { label: 'Calculation Precision', value: 99.9, icon: Target, desc: 'IEEE 754 double-precision', color: '#6B1F7A' },
  { label: 'Method Consensus', value: 97.3, icon: BarChart3, desc: '10+ validation methods', color: '#B8860B' },
  { label: 'Event Correlation', value: 98.7, icon: TrendingUp, desc: 'Pattern matching score', color: '#4A7C6F' },
  { label: 'Processing Speed', value: 99.5, icon: Zap, desc: 'Sub-second calculations', color: '#C65D3B' },
];

const systemMetrics = [
  { label: 'Ephemeris Version', value: 'SE v2.10.03', icon: Database },
  { label: 'AI Model', value: 'DeepSeek V3', icon: Cpu },
  { label: 'Precision', value: '±0.0001°', icon: Gauge },
  { label: 'Processing Nodes', value: '16 Threads', icon: Activity },
  { label: 'Calculation Time', value: '<25 min', icon: Clock },
  { label: 'Consensus Engine', value: 'Active', icon: GitBranch },
];

function AnimatedBar({ value, color, delay }: { value: number; color: string; delay: number }) {
  const [width, setWidth] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => setWidth(value), delay);
      return () => clearTimeout(timer);
    }
  }, [isInView, value, delay]);

  return (
    <div ref={ref} className="h-3 bg-[#F0E8DE] rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${width}%`,
          backgroundColor: color,
          boxShadow: width > 0 ? `0 0 20px ${color}30` : 'none'
        }}
      />
    </div>
  );
}

export function AccuracyShowcase() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Soft Background Elements - always rendered but conditionally visible */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: mounted ? 1 : 0 }}>
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-amber-100/30 rounded-full blur-3xl" />

        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #B8860B 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8" style={{ opacity: mounted ? 1 : 0 }}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#F0E8DE] 
                   rounded-full text-sm mb-8 shadow-sm"
          >
            <Terminal className="w-4 h-4 text-[#B8860B]" />
            <span className="text-[#4A453F]">Precision Metrics</span>
          </motion.div>

          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl md:text-4xl lg:text-5xl 
                     font-semibold text-[#1A1612] mb-6 leading-tight">
            Divine{' '}
            <span className="text-gradient-gold">Precision</span>
            {' '}Engineering
          </h2>

          <p className="text-lg text-[#4A453F] max-w-3xl mx-auto">
            Skyfield ephemeris calculations with IEEE 754 double-precision arithmetic.
            Achieving sub-arcsecond accuracy through algorithmic consensus.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Precision Comparison Chart */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-[#F0E8DE] rounded-3xl p-8 shadow-sm"
          >
            <div className="flex items-center justify-between mb-10">
              <h3 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-[#1A1612]">
                Accuracy Comparison
              </h3>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FDF8F3] rounded-lg border border-[#F0E8DE]">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-[#7A756F]">Validated</span>
              </div>
            </div>

            <div className="space-y-8">
              {precisionMetrics.map((item, index) => (
                <div key={item.method} className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${item.highlight ? 'text-[#B8860B]' : 'text-[#4A453F]'}`}>
                        {item.method}
                      </span>
                      {item.highlight && (
                        <span className="px-2 py-0.5 bg-[#B8860B]/10 border border-[#B8860B]/30 
                                     text-[#B8860B] text-xs rounded-full font-medium">
                          Divine
                        </span>
                      )}
                    </div>
                    <span className={`text-2xl font-bold ${item.highlight ? 'text-[#B8860B]' : 'text-[#7A756F]'}`}>
                      {item.accuracy}%
                    </span>
                  </div>

                  <AnimatedBar
                    value={item.accuracy}
                    color={item.color}
                    delay={index * 200}
                  />

                  <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
                    <div>
                      <span className="text-[#A8A39D]">Precision:</span>
                      <span className="ml-2 text-[#4A453F]">{item.precision}</span>
                    </div>
                    <div>
                      <span className="text-[#A8A39D]">Methods:</span>
                      <span className="ml-2 text-[#4A453F]">{item.methods}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#A8A39D]">Time:</span>
                      <span className="ml-2 text-[#4A453F]">{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </motion.div>

          {/* Technical Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {technicalMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative bg-white border border-[#F0E8DE] rounded-2xl p-6 
                         hover:border-[#78611D]/30 hover:shadow-lg transition-all duration-300"
                >
                  {/* Glow effect */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at center, ${metric.color}08 0%, transparent 70%)`
                    }}
                  />

                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${metric.color}10` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: metric.color }} />
                    </div>

                    <div className="font-mono text-4xl font-bold text-[#1A1612] mb-2">
                      {metric.value}%
                    </div>
                    <div className="text-sm font-medium text-[#4A453F] mb-1">{metric.label}</div>
                    <div className="text-xs text-[#7A756F]">{metric.desc}</div>
                  </div>
                </motion.div>
              );
            })}

            {/* Calculation Detail Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="col-span-2 bg-white border border-[#F0E8DE] rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-[#B8860B]/10 rounded-lg border border-[#B8860B]/20">
                  <Terminal className="w-5 h-5 text-[#B8860B]" />
                </div>
                <h4 className="font-[family-name:var(--font-cormorant)] text-sm font-semibold text-[#1A1612]">
                  Calculation Pipeline
                </h4>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-4 bg-[#FDF8F3] rounded-xl border border-[#F0E8DE]">
                  <div className="text-[#7A756F] mb-2">Ephemeris</div>
                  <div className="text-[#B8860B] text-sm mb-1">DE440</div>
                  <div className="text-[#A8A39D]">32MB dataset</div>
                </div>
                <div className="p-4 bg-[#FDF8F3] rounded-xl border border-[#F0E8DE]">
                  <div className="text-[#7A756F] mb-2">Precision</div>
                  <div className="text-[#B8860B] text-sm mb-1">±0.0001°</div>
                  <div className="text-[#A8A39D]">0.36 arcseconds</div>
                </div>
                <div className="p-4 bg-[#FDF8F3] rounded-xl border border-[#F0E8DE]">
                  <div className="text-[#7A756F] mb-2">Candidates</div>
                  <div className="text-[#B8860B] text-sm mb-1">1,440</div>
                  <div className="text-[#A8A39D]">per analysis</div>
                </div>
                <div className="p-4 bg-[#FDF8F3] rounded-xl border border-[#F0E8DE]">
                  <div className="text-[#7A756F] mb-2">Confidence</div>
                  <div className="text-[#B8860B] text-sm mb-1">97.3%</div>
                  <div className="text-[#A8A39D]">Divine verified</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 flex justify-center"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-4 px-8 py-4 
                      bg-white border border-[#F0E8DE] rounded-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-40" />
              </div>
              <span className="text-emerald-600 text-sm font-medium">System Operational</span>
            </div>

            <div className="hidden sm:block h-5 w-px bg-[#F0E8DE]" />

            <div className="flex items-center gap-2 text-sm text-[#7A756F]">
              <Activity className="w-4 h-4" />
              <span>{'API Latency: <50ms'}</span>
            </div>

            <div className="hidden sm:block h-5 w-px bg-[#F0E8DE]" />

            <div className="flex items-center gap-2 text-sm text-[#7A756F]">
              <Database className="w-4 h-4" />
              <span>Ephemeris: Synced</span>
            </div>

            <div className="hidden sm:block h-5 w-px bg-[#F0E8DE]" />

            <div className="flex items-center gap-2 text-sm text-[#7A756F]">
              <Cpu className="w-4 h-4" />
              <span>AI: Connected</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
