/**
 * Problem Section - Sacred Ivory Edition
 * Elegant comparison with balanced spacing
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Cpu, 
  Timer, 
  GitCompare,
  XCircle,
  CheckCircle2,
  Database,
  Target,
  Telescope,
  Brain,
  Server,
  Layers,
  Workflow,
  Star
} from 'lucide-react';

const comparisonPoints = [
  {
    category: 'Calculation Precision',
    manual: {
      title: 'Manual Calculation',
      issues: [
        'Prone to arithmetic errors',
        'Limited decimal precision (2-4 places)',
        'Interpolation approximations',
        'Rounding error accumulation'
      ],
      accuracy: '±5-15 minutes'
    },
    ai: {
      title: 'Skyfield Ephemeris Engine',
      advantages: [
        'IEEE 754 double-precision (64-bit)',
        '8+ decimal places maintained',
        'NASA JPL ephemeris data',
        'Exact Skyfield calculations'
      ],
      accuracy: '±0.0001° (0.36 arcsec)'
    },
    icon: Target,
    color: '#6B1F7A'
  },
  {
    category: 'Processing Speed',
    manual: {
      title: 'Human Astrologer',
      issues: [
        '3-7 days turnaround',
        'Single-threaded analysis',
        'Manual chart drawing',
        'Iterative trial-and-error'
      ],
      accuracy: '20-40 hours'
    },
    ai: {
      title: 'BTR Pipeline Engine',
      advantages: [
        '40-50 minutes total processing',
        '6-stage pipeline parallelization',
        'Automated candidate generation',
        'Systematic batch tournament'
      ],
      accuracy: '<50 minutes'
    },
    icon: Timer,
    color: '#B8860B'
  },
  {
    category: 'Method Coverage',
    manual: {
      title: 'Traditional Approach',
      issues: [
        '1-2 methods typically used',
        'Expert-dependent selection',
        'Inconsistent application',
        'Subjective weighting'
      ],
      accuracy: '2 methods'
    },
    ai: {
      title: 'Multi-Method Consensus',
      advantages: [
        'Vimshottari, Yogini, Chara Dasha',
        'KP System sub-lord analysis',
        'Ashtakavarga scoring',
        'D9/D10/D60 divisional charts'
      ],
      accuracy: '8+ methods'
    },
    icon: GitCompare,
    color: '#4A7C6F'
  },
  {
    category: 'Data Processing',
    manual: {
      title: 'Human Analysis',
      issues: [
        'Limited event correlation',
        'Memory constraints',
        'Cognitive bias',
        'Fatigue-induced errors'
      ],
      accuracy: '3-5 events'
    },
    ai: {
      title: 'Event Stream Architecture',
      advantages: [
        'Real-time SSE streaming',
        'Ephemeris cache (1000 entries)',
        'Progress tracker with persistence',
        'Consistent 24/7 operation'
      ],
      accuracy: '∞ events'
    },
    icon: Database,
    color: '#C65D3B'
  }
];

const technicalSpecs = [
  { label: 'Ephemeris', value: 'Skyfield', icon: Telescope, color: '#8B4A9C' },
  { label: 'Precision', value: '±0.0001° (0.36 arcsec)', icon: Target, color: '#B8860B' },
  { label: 'AI Model', value: 'DeepSeek R1', icon: Brain, color: '#4A7C6F' },
  { label: 'Database', value: 'Neon Postgres', icon: Database, color: '#C65D3B' },
  { label: 'ORM', value: 'Drizzle', icon: Layers, color: '#6B1F7A' },
  { label: 'Cache', value: 'LRU Cache (1000)', icon: Server, color: '#78611D' },
];

const backendComponents = [
  { name: 'Ephemeris Service', purpose: 'Skyfield ephemeris calculations via Python service', color: '#6B1F7A' },
  { name: 'BTR Processor', purpose: '6-stage batch tournament pipeline', color: '#B8860B' },
  { name: 'Session Manager', purpose: 'Real-time SSE event streaming', color: '#4A7C6F' },
  { name: 'Progress Tracker', purpose: 'In-memory progress with persistence', color: '#C65D3B' },
  { name: 'Consensus Engine', purpose: 'Multi-method weighted scoring', color: '#4A7C6F' },
  { name: 'AI Client', purpose: 'DeepSeek integration', color: '#8B4A9C' },
];

export default function Problem() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Soft Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-purple-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-amber-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
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
            <GitCompare className="w-4 h-4 text-[#6B1F7A]" />
            <span className="text-[#4A453F]">Technical Comparison</span>
          </motion.div>
          
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl md:text-4xl lg:text-5xl 
                         font-semibold text-[#1A1612] mb-6 leading-tight">
            Algorithmic{' '}
            <span className="text-gradient-gold">Precision</span>
            {' '}vs Manual Methods
          </h2>
          
          <p className="text-lg text-[#4A453F] max-w-3xl mx-auto leading-relaxed">
            Why computational Vedic astrology achieves superior results through 
            systematic algorithmic processing aligned with cosmic precision.
          </p>
        </motion.div>

        {/* Technical Specs Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-20"
        >
          {technicalSpecs.map((spec, index) => {
            const Icon = spec.icon;
            return (
              <motion.div
                key={spec.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative p-5 bg-white border border-[#F0E8DE] rounded-2xl 
                           hover:border-[#78611D]/30 hover:shadow-lg transition-all duration-300 text-center"
              >
                {/* Subtle glow */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at center, ${spec.color}08 0%, transparent 70%)`
                  }}
                />
                
                <div className="relative">
                  <Icon className="w-6 h-6 mx-auto mb-3" style={{ color: spec.color }} />
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[#7A756F] mb-1">{spec.label}</div>
                  <div className="text-sm font-medium text-[#1A1612]">{spec.value}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Backend Components */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h3 className="font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1A1612] mb-8 text-center">
            Sacred Architecture Components
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {backendComponents.map((comp, index) => (
              <motion.div
                key={comp.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group p-5 bg-white border border-[#F0E8DE] rounded-2xl 
                           hover:border-[#78611D]/30 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${comp.color}10` }}
                  >
                    <Workflow className="w-5 h-5" style={{ color: comp.color }} />
                  </div>
                  <div>
                    <span className="font-semibold text-[#1A1612] block">{comp.name}</span>
                    <span className="text-sm text-[#7A756F]">{comp.purpose}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Comparison Cards */}
        <div className="space-y-6">
          {comparisonPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.category}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="grid md:grid-cols-2 gap-4"
              >
                {/* Manual Method Card */}
                <div className="p-6 lg:p-8 bg-[#FDF8F3] border border-[#F0E8DE] rounded-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                      <XCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.15em] text-[#7A756F]">{point.category}</div>
                      <h3 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-[#4A453F]">
                        {point.manual.title}
                      </h3>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {point.manual.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-[#7A756F]">
                        <span className="text-red-400 mt-1">×</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-4 border-t border-[#F0E8DE]">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-[#A8A39D] mb-1">Typical Result</div>
                    <div className="text-red-400 font-mono text-lg">{point.manual.accuracy}</div>
                  </div>
                </div>

                {/* AI Method Card */}
                <div className="relative p-6 lg:p-8 bg-white border-2 border-[#78611D]/30 rounded-2xl 
                                overflow-hidden group hover:border-[#78611D]/50 transition-all duration-300">
                  {/* Glow effect */}
                  <div 
                    className="absolute top-0 right-0 w-40 h-40 opacity-10 group-hover:opacity-20 transition-opacity"
                    style={{
                      background: `radial-gradient(circle, ${point.color} 0%, transparent 70%)`
                    }}
                  />
                  
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-6">
                      <div 
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: `${point.color}10` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: point.color }} />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.15em] text-[#7A756F]">{point.category}</div>
                        <h3 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-[#1A1612]">
                          {point.ai.title}
                        </h3>
                      </div>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      {point.ai.advantages.map((advantage, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-[#4A453F]">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: point.color }} />
                          {advantage}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="pt-4 border-t border-[#F0E8DE]">
                      <div className="text-[10px] uppercase tracking-[0.15em] text-[#A8A39D] mb-1">Achieved Result</div>
                      <div className="font-mono text-lg font-semibold" style={{ color: point.color }}>
                        {point.ai.accuracy}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20 p-8 lg:p-12 bg-gradient-to-br from-[#FDF8F3] via-white to-[#FAF5EF] 
                     border border-[#F0E8DE] rounded-3xl relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-100/30 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-[#B8860B] fill-[#B8860B]" />
                <span className="text-xs uppercase tracking-[0.2em] text-[#B8860B]">Begin Your Journey</span>
              </div>
              <h3 className="font-[family-name:var(--font-cormorant)] text-2xl lg:text-3xl font-semibold text-[#1A1612] mb-2">
                Experience Divine Precision
              </h3>
              <p className="text-[#4A453F]">
                Join the sacred revolution in Vedic astrology through algorithmic mastery.
              </p>
            </div>
            <Link href="/rectify">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-gradient-to-r from-[#B8860B] to-[#78611D] text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
              >
                Start Analysis
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
