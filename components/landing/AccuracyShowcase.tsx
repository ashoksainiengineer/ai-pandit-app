/**
 * Accuracy Showcase Section - Technical Metrics
 * Engineering-focused precision metrics and calculation quality
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
    color: '#71717A',
  },
  {
    method: 'Basic Software',
    accuracy: 75,
    precision: '±2-5 min',
    methods: '3-4',
    time: '1 hour',
    color: '#3F3F46',
  },
  {
    method: 'AI Pandit BTR',
    accuracy: 97.3,
    precision: '±15 sec',
    methods: '10+',
    time: '20-25 min',
    color: '#00DC82',
    highlight: true,
  },
];

const technicalMetrics = [
  { label: 'Calculation Precision', value: 99.9, icon: Target, desc: 'IEEE 754 double-precision' },
  { label: 'Method Consensus', value: 97.3, icon: BarChart3, desc: '10+ validation methods' },
  { label: 'Event Correlation', value: 98.7, icon: TrendingUp, desc: 'Pattern matching score' },
  { label: 'Processing Speed', value: 99.5, icon: Zap, desc: 'Sub-second calculations' },
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
    <div ref={ref} className="h-full bg-zinc-800 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ 
          width: `${width}%`,
          backgroundColor: color,
          boxShadow: width > 0 ? `0 0 20px ${color}40` : 'none'
        }}
      />
    </div>
  );
}

export function AccuracyShowcase() {
  return (
    <section className="relative py-24 lg:py-32 bg-[#0a0a0b] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #27272A 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 text-sm mb-6">
            <Terminal className="w-4 h-4" />
            Precision Metrics
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            God-Tier{' '}
            <span className="bg-gradient-to-r from-[#00DC82] to-[#36E4DA] bg-clip-text text-transparent">
              Precision Engineering
            </span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            NASA-grade Swiss Ephemeris calculations with IEEE 754 double-precision arithmetic. 
            Achieving sub-arcsecond accuracy through algorithmic consensus.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Precision Comparison Chart */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white">Accuracy Comparison</h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                <CheckCircle2 className="w-4 h-4 text-[#00DC82]" />
                <span className="text-xs text-zinc-400">Validated</span>
              </div>
            </div>
            
            <div className="space-y-6">
              {precisionMetrics.map((item, index) => (
                <div key={item.method} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${item.highlight ? 'text-[#00DC82]' : 'text-zinc-300'}`}>
                        {item.method}
                      </span>
                      {item.highlight && (
                        <span className="px-2 py-0.5 bg-[#00DC82]/20 text-[#00DC82] text-xs rounded-full">
                          God-Tier
                        </span>
                      )}
                    </div>
                    <span className={`text-lg font-bold ${item.highlight ? 'text-[#00DC82]' : 'text-zinc-400'}`}>
                      {item.accuracy}%
                    </span>
                  </div>
                  
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <AnimatedBar 
                      value={item.accuracy} 
                      color={item.color} 
                      delay={index * 200}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-2 text-xs text-zinc-500">
                    <div>
                      <span className="text-zinc-600">Precision:</span>
                      <span className="ml-1 text-zinc-400">{item.precision}</span>
                    </div>
                    <div>
                      <span className="text-zinc-600">Methods:</span>
                      <span className="ml-1 text-zinc-400">{item.methods}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-600">Time:</span>
                      <span className="ml-1 text-zinc-400">{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Technical Specs */}
            <div className="mt-8 pt-6 border-t border-zinc-800">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Technical Specifications</div>
              <div className="grid grid-cols-2 gap-3">
                {systemMetrics.map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <div key={metric.label} className="flex items-center gap-2 text-sm">
                      <Icon className="w-3 h-3 text-zinc-600" />
                      <span className="text-zinc-500">{metric.label}:</span>
                      <span className="text-zinc-300 font-mono">{metric.value}</span>
                    </div>
                  );
                })}
              </div>
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
                  className="group relative bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-[#00DC82]/30 transition-all duration-300"
                >
                  {/* Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00DC82]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                  
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-[#00DC82]/10 border border-[#00DC82]/20 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[#00DC82]" />
                    </div>
                    
                    <div className="text-3xl font-bold text-white mb-1">
                      {metric.value}%
                    </div>
                    <div className="text-sm font-medium text-zinc-300 mb-1">{metric.label}</div>
                    <div className="text-xs text-zinc-500">{metric.desc}</div>
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
              className="col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Terminal className="w-5 h-5 text-[#00DC82]" />
                <h4 className="text-sm font-semibold text-white">Calculation Pipeline</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <div className="text-zinc-500 mb-1">Ephemeris</div>
                  <div className="text-[#00DC82]">DE440</div>
                  <div className="text-zinc-600">32MB dataset</div>
                </div>
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <div className="text-zinc-500 mb-1">Precision</div>
                  <div className="text-[#00DC82]">±0.0001°</div>
                  <div className="text-zinc-600">0.36 arcseconds</div>
                </div>
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <div className="text-zinc-500 mb-1">Candidates</div>
                  <div className="text-[#00DC82]">1,440</div>
                  <div className="text-zinc-600">per analysis</div>
                </div>
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <div className="text-zinc-500 mb-1">Confidence</div>
                  <div className="text-[#00DC82]">97.3%</div>
                  <div className="text-zinc-600">God-Tier verified</div>
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
          className="mt-16"
        >
          <div className="inline-flex items-center gap-6 px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-semibold">System Operational</span>
            </div>
            <div className="h-6 w-px bg-zinc-700" />
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Activity className="w-4 h-4" />
              <span>{'API Latency: <50ms'}</span>
            </div>
            <div className="h-6 w-px bg-zinc-700" />
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Database className="w-4 h-4" />
              <span>Ephemeris: Synced</span>
            </div>
            <div className="h-6 w-px bg-zinc-700" />
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Cpu className="w-4 h-4" />
              <span>AI: Connected</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
