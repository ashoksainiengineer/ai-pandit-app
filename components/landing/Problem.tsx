/**
 * Problem Section - Technical Pain Points
 * Focus on technical superiority and algorithmic precision
 */

'use client';

import { motion } from 'framer-motion';
import { 
  Cpu, 
  Timer, 
  GitCompare,
  XCircle,
  CheckCircle2,
  Database,
  Activity,
  Target,
  Zap,
  Telescope,
  Brain,
  Server,
  Layers,
  Workflow
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
      title: 'Swiss Ephemeris Engine',
      advantages: [
        'IEEE 754 double-precision (64-bit)',
        '8+ decimal places maintained',
        'NASA JPL ephemeris data',
        'Exact Swiss Ephemeris calculations'
      ],
      accuracy: '±0.0001° (0.36 arcsec)'
    },
    icon: Target,
    color: '#8B5CF6'
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
    color: '#6366F1'
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
    color: '#D4AF37'
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
    color: '#10B981'
  }
];

const technicalSpecs = [
  { label: 'Ephemeris', value: 'Swiss Ephemeris', icon: Telescope },
  { label: 'Precision', value: '±0.0001° (0.36 arcsec)', icon: Target },
  { label: 'AI Model', value: 'DeepSeek R1', icon: Brain },
  { label: 'Database', value: 'Turso (libSQL)', icon: Database },
  { label: 'ORM', value: 'Drizzle', icon: Layers },
  { label: 'Cache', value: 'LRU Cache (1000)', icon: Server },
];

const backendComponents = [
  { name: 'Ephemeris Service', purpose: 'Swiss Ephemeris calculations with WASM' },
  { name: 'BTR Processor', purpose: '6-stage batch tournament pipeline' },
  { name: 'Session Manager', purpose: 'Real-time SSE event streaming' },
  { name: 'Progress Tracker', purpose: 'In-memory progress with persistence' },
  { name: 'Consensus Engine', purpose: 'Multi-method weighted scoring' },
  { name: 'AI Client', purpose: 'DeepSeek integration' },
];

export default function Problem() {
  return (
    <section className="py-24 bg-[#0A0F1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1F2E] border border-[#2A3442] rounded-full text-[#8C7F72] text-sm mb-6">
            <GitCompare className="w-4 h-4" />
            Technical Comparison
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#F5F0EB] mb-4">
            Algorithmic{' '}
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] bg-clip-text text-transparent">
              Precision
            </span>
            {' '}vs Manual Methods
          </h2>
          <p className="text-lg text-[#8C7F72] max-w-3xl mx-auto">
            Why computational Vedic astrology achieves superior results through 
            systematic algorithmic processing.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16"
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
                className="p-4 bg-[#1A1F2E]/50 rounded-xl border border-[#2A3442] text-center backdrop-blur-sm"
              >
                <Icon className="w-5 h-5 text-[#D4AF37] mx-auto mb-2" />
                <div className="text-xs text-[#5A6475] uppercase tracking-wider mb-1">{spec.label}</div>
                <div className="text-sm font-medium text-[#F5F0EB]">{spec.value}</div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h3 className="text-xl font-semibold text-[#F5F0EB] mb-6 text-center">
            Backend Architecture Components
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {backendComponents.map((comp, index) => (
              <motion.div
                key={comp.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-4 bg-[#1A1F2E]/30 border border-[#2A3442] rounded-xl"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Workflow className="w-4 h-4 text-[#8B5CF6]" />
                  <span className="font-semibold text-[#F5F0EB]">{comp.name}</span>
                </div>
                <div className="text-sm text-[#8C7F72]">{comp.purpose}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-8">
          {comparisonPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.category}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="grid md:grid-cols-2 gap-6"
              >
                <div className="p-6 bg-[#1A1F2E]/30 border border-[#2A3442] rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <div className="text-sm text-[#8C7F72]">{point.category}</div>
                      <h3 className="text-lg font-semibold text-[#C4B8AD]">{point.manual.title}</h3>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {point.manual.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#8C7F72]">
                        <span className="text-red-400 mt-1">×</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4 border-t border-[#2A3442]">
                    <div className="text-xs text-[#5A6475] uppercase tracking-wider mb-1">Typical Result</div>
                    <div className="text-red-400 font-mono">{point.manual.accuracy}</div>
                  </div>
                </div>

                <div className="p-6 bg-[#1A1F2E]/50 border border-[#8B5CF6]/30 rounded-2xl relative overflow-hidden backdrop-blur-sm">
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 opacity-10"
                    style={{ background: `radial-gradient(circle, ${point.color} 0%, transparent 70%)` }}
                  />
                  <div className="flex items-center gap-3 mb-4 relative">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${point.color}20` }}>
                      <Icon className="w-5 h-5" style={{ color: point.color }} />
                    </div>
                    <div>
                      <div className="text-sm text-[#8C7F72]">{point.category}</div>
                      <h3 className="text-lg font-semibold text-[#F5F0EB]">{point.ai.title}</h3>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-4 relative">
                    {point.ai.advantages.map((advantage, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#C4B8AD]">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: point.color }} />
                        {advantage}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4 border-t border-[#2A3442] relative">
                    <div className="text-xs text-[#5A6475] uppercase tracking-wider mb-1">Achieved Result</div>
                    <div className="font-mono font-semibold" style={{ color: point.color }}>
                      {point.ai.accuracy}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 p-8 bg-gradient-to-r from-[#1A1F2E] to-[#0F1419] border border-[#2A3442] rounded-2xl"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-[#F5F0EB] mb-2">
                Experience Algorithmic Precision
              </h3>
              <p className="text-[#8C7F72]">
                Join the technical revolution in Vedic astrology.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
