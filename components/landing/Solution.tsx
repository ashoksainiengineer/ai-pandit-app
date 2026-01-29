/**
 * Solution Section - Technical Workflow
 * Displays the processing pipeline
 */

'use client';

import { motion } from 'framer-motion';
import {
  Terminal,
  Database,
  Brain,
  ArrowRight,
  GitBranch,
  Layers,
  Zap,
  Activity,
  Star,
  Telescope,
  Sparkles,
  Server,
  Cpu,
  Workflow
} from 'lucide-react';

const pipelineSteps = [
  {
    number: '01',
    phase: 'Initialization',
    title: 'System Bootstrap',
    description: 'Load Swiss Ephemeris, initialize cache, connect to Turso database, validate schema.',
    technologies: ['Swiss Ephemeris', 'Turso', 'Drizzle ORM'],
    metrics: { label: 'Cache Size', value: '1000' },
    icon: Server,
    color: '#8B5CF6'
  },
  {
    number: '02',
    phase: 'Stage 1',
    title: 'Exhaustive Data Generation',
    description: 'Generate candidate timestamps with safety net injection. Build data packages with Julian Day and Ayanamsa.',
    technologies: ['Candidate Generator', 'Safety Net', 'Data Package Builder'],
    metrics: { label: 'Candidates', value: '1,440+' },
    icon: Database,
    color: '#6366F1'
  },
  {
    number: '03',
    phase: 'Stage 2',
    title: 'Batch Tournament',
    description: 'Split candidates into batches with dynamic sizing. Execute AI calls in parallel and score with Dasha correlation.',
    technologies: ['Batch Splitter', 'Parallel Executor', 'Scoring Engine'],
    metrics: { label: 'Survivors', value: '~435' },
    icon: Workflow,
    color: '#D4AF37'
  },
  {
    number: '04',
    phase: 'Stage 3',
    title: 'Refinement Grid',
    description: 'Generate fine grid around top survivors. Compute D9 Navamsa, D10 Dasamsa, and D60 Shashtyamsa.',
    technologies: ['Grid Generator', 'Varga Calculator', 'Vimsopaka Bala'],
    metrics: { label: 'Refined', value: '310' },
    icon: Layers,
    color: '#EC4899'
  },
  {
    number: '05',
    phase: 'Stage 4',
    title: 'Deep Multi-Dasha Analysis',
    description: 'Analyze with Vimshottari, Yogini, Chara, KP System, and Ashtakavarga. Correlate life events.',
    technologies: ['Vimshottari', 'Yogini', 'Chara', 'KP', 'Ashtakavarga'],
    metrics: { label: 'Finalists', value: '21' },
    icon: Star,
    color: '#10B981'
  },
  {
    number: '06',
    phase: 'Stage 5',
    title: 'Micro Precision Grid',
    description: 'Generate micro grid at 6-second intervals. Compute D60 deities and detect Bhava Chalit discrepancies.',
    technologies: ['Micro Grid', 'D60 Deities', 'Chalit Detector'],
    metrics: { label: 'Micro', value: '15' },
    icon: Telescope,
    color: '#F59E0B'
  },
  {
    number: '07',
    phase: 'Stage 6',
    title: 'Final Precision Judgement',
    description: 'Apply God-Tier enhancement with DeepSeek R1. Full forensic context analysis and final verdict extraction.',
    technologies: ['God-Tier Enhancer', 'DeepSeek R1', 'Verdict Extractor'],
    metrics: { label: 'Precision', value: '±15s' },
    icon: Brain,
    color: '#EF4444'
  },
  {
    number: '08',
    phase: 'Output',
    title: 'Report Generation',
    description: 'Generate structured response with ephemeris data and divisional charts. Stream via SSE to client.',
    technologies: ['Session Manager', 'Event Emitter', 'Database'],
    metrics: { label: 'Report', value: '23 pages' },
    icon: Zap,
    color: '#00DC82'
  }
];

const architectureLayers = [
  { name: 'Frontend', tech: 'Next.js + React', status: 'Streaming UI' },
  { name: 'API Gateway', tech: 'Express + TypeScript', status: 'Rate Limited' },
  { name: 'Event Stream', tech: 'Session Manager', status: 'SSE Active' },
  { name: 'BTR Engine', tech: 'Pipeline Processor', status: '6 Stages' },
  { name: 'Ephemeris', tech: 'Swiss Ephemeris', status: 'High Precision' },
  { name: 'AI Service', tech: 'DeepSeek R1', status: 'Connected' },
  { name: 'Database', tech: 'Turso', status: 'Synced' },
  { name: 'Progress', tech: 'Progress Tracker', status: 'Active' },
];

export default function Solution() {
  return (
    <section id="how-it-works" className="py-24 bg-[#0A0F1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1F2E] border border-[#2A3442] rounded-full text-[#8C7F72] text-sm mb-6">
            <GitBranch className="w-4 h-4" />
            Processing Pipeline
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#F5F0EB] mb-4">
            Technical{' '}
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] bg-clip-text text-transparent">
              Workflow
            </span>
          </h2>
          <p className="text-lg text-[#8C7F72] max-w-3xl mx-auto">
            From raw birth details to precision rectified time.
            Eight-stage pipeline with God-Tier accuracy.
          </p>
        </motion.div>

        <div className="space-y-4 mb-20">
          {pipelineSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative bg-[#1A1F2E]/50 border border-[#2A3442] rounded-2xl p-6 hover:border-[#3A4452] transition-all duration-300 backdrop-blur-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex items-center gap-4 lg:w-64 shrink-0">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${step.color}15`, border: `1px solid ${step.color}30` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: step.color }} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#3A4452] font-mono">{step.number}</div>
                        <div className="text-xs text-[#8C7F72] uppercase tracking-wider">{step.phase}</div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#F5F0EB] mb-2">{step.title}</h3>
                      <p className="text-sm text-[#8C7F72] mb-4">{step.description}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {step.technologies.map((tech) => (
                          <span 
                            key={tech}
                            className="px-2 py-1 bg-[#0F1419] rounded text-xs font-mono text-[#5A6475]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="lg:w-48 shrink-0 lg:text-right">
                      <div className="text-xs text-[#5A6475] mb-1">{step.metrics.label}</div>
                      <div className="text-lg font-mono font-semibold" style={{ color: step.color }}>
                        {step.metrics.value}
                      </div>
                    </div>
                  </div>

                  {index < pipelineSteps.length - 1 && (
                    <div className="hidden lg:block absolute left-[4.5rem] top-full w-px h-4 bg-gradient-to-b from-[#3A4452] to-transparent" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-[#1A1F2E]/30 border border-[#2A3442] rounded-2xl p-8 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-semibold text-[#F5F0EB] mb-2">System Architecture</h3>
              <p className="text-sm text-[#8C7F72]">Backend components overview</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-emerald-400">Operational</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {architectureLayers.map((layer, index) => (
              <motion.div
                key={layer.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-4 bg-[#0F1419]/50 rounded-xl border border-[#2A3442] hover:border-[#3A4452] transition-colors"
              >
                <div className="text-xs text-[#5A6475] uppercase tracking-wider mb-2">{layer.name}</div>
                <div className="text-sm font-medium text-[#F5F0EB] mb-1">{layer.tech}</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-[#8C7F72]">{layer.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
