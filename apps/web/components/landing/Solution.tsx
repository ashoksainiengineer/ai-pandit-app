/**
 * Solution Section - Sacred Ivory Edition
 * Elegant workflow presentation with beautiful spacing
 */

import {
  Terminal,
  Database,
  Brain,
  GitBranch,
  Layers,
  Star,
  Telescope,
  Server,
  Workflow,
  Zap,
  Moon
} from 'lucide-react';

const pipelineSteps = [
  {
    number: '01',
    phase: 'Initialization',
    title: 'System Bootstrap',
    description: 'Load Skyfield ephemeris, initialize cache, connect to database, validate schema.',
    technologies: ['Skyfield', 'Neon Postgres', 'Drizzle ORM'],
    metrics: { label: 'Cache Size', value: '1000' },
    icon: Server,
    color: '#6B1F7A'
  },
  {
    number: '02',
    phase: 'Stage 1',
    title: 'Exhaustive Data Generation',
    description: 'Generate candidate timestamps with safety net injection. Build data packages with Julian Day and Ayanamsa.',
    technologies: ['Candidate Generator', 'Safety Net', 'Data Package Builder'],
    metrics: { label: 'Candidates', value: '1,440+' },
    icon: Database,
    color: '#8B4A9C'
  },
  {
    number: '03',
    phase: 'Stage 2',
    title: 'Batch Tournament',
    description: 'Split candidates into batches with dynamic sizing. Execute AI calls in parallel and score with Dasha correlation.',
    technologies: ['Batch Splitter', 'Parallel Executor', 'Scoring Engine'],
    metrics: { label: 'Survivors', value: '~435' },
    icon: Workflow,
    color: '#000000'
  },
  {
    number: '04',
    phase: 'Stage 3',
    title: 'Refinement Grid',
    description: 'Generate fine grid around top survivors. Compute D9 Navamsa, D10 Dasamsa, and D60 Shashtyamsa.',
    technologies: ['Grid Generator', 'Varga Calculator', 'Vimsopaka Bala'],
    metrics: { label: 'Refined', value: '310' },
    icon: Layers,
    color: '#4A7C6F'
  },
  {
    number: '05',
    phase: 'Stage 4',
    title: 'Deep Multi-Dasha Analysis',
    description: 'Analyze with Vimshottari, Yogini, Chara, KP System, and Ashtakavarga. Correlate life events.',
    technologies: ['Vimshottari', 'Yogini', 'Chara', 'KP', 'Ashtakavarga'],
    metrics: { label: 'Finalists', value: '21' },
    icon: Star,
    color: '#C65D3B'
  },
  {
    number: '06',
    phase: 'Stage 5',
    title: 'Micro Precision Grid',
    description: 'Generate micro grid at 6-second intervals. Compute D60 deities and detect Bhava Chalit discrepancies.',
    technologies: ['Micro Grid', 'D60 Deities', 'Chalit Detector'],
    metrics: { label: 'Micro', value: '15' },
    icon: Telescope,
    color: '#4A7C6F'
  },
  {
    number: '07',
    phase: 'Stage 6',
    title: 'Final Precision Judgement',
    description: 'Apply God-Tier enhancement with DeepSeek R1. Full astrological context analysis and final verdict extraction.',
    technologies: ['God-Tier Enhancer', 'DeepSeek R1', 'Verdict Extractor'],
    metrics: { label: 'Precision', value: '±15s' },
    icon: Brain,
    color: '#6B1F7A'
  },
  {
    number: '08',
    phase: 'Output',
    title: 'Report Generation',
    description: 'Generate structured response with ephemeris data and divisional charts. Stream via SSE to client.',
    technologies: ['Session Manager', 'Event Emitter', 'Database'],
    metrics: { label: 'Report', value: '23 pages' },
    icon: Zap,
    color: '#000000'
  }
];

const architectureLayers = [
  { name: 'Frontend', tech: 'Next.js + React', status: 'Streaming UI', color: '#6B1F7A' },
  { name: 'API Gateway', tech: 'Express + TypeScript', status: 'Rate Limited', color: '#8B4A9C' },
  { name: 'Event Stream', tech: 'Session Manager', status: 'SSE Active', color: '#000000' },
  { name: 'BTR Engine', tech: 'Pipeline Processor', status: '6 Stages', color: '#4A7C6F' },
  { name: 'Ephemeris', tech: 'Skyfield', status: 'High Precision', color: '#C65D3B' },
  { name: 'AI Service', tech: 'DeepSeek R1', status: 'Connected', color: '#4A7C6F' },
  { name: 'Database', tech: 'Neon Postgres', status: 'Synced', color: '#000000' },
  { name: 'Progress', tech: 'Progress Tracker', status: 'Active', color: '#B8A1C9' },
];

export default function Solution() {
  return (
    <section id="how-it-works" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Soft Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-emerald-100/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div
          className="text-center mb-20"
        >
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[rgba(0,0,0,0.08)] 
                       rounded-full text-sm mb-8"
          >
            <GitBranch className="w-4 h-4 text-[#4A7C6F]" />
            <span className="text-[#636363]">Processing Pipeline</span>
          </div>
          
          <h2 className=" text-3xl md:text-4xl lg:text-5xl 
                         font-medium text-black mb-6 leading-tight">
            Sacred{' '}
            <span className="text-black">Technical</span>
            {' '}Workflow
          </h2>
          
          <p className="text-lg text-[#636363] max-w-3xl mx-auto">
            From raw birth details to precision rectified time.
            Eight-stage pipeline with divine accuracy.
          </p>
        </div>

        {/* Pipeline Steps */}
        <div className="space-y-4 mb-24">
          {pipelineSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="group"
              >
                <div className="relative bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-6 
                                hover:border-[#000000]/30 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Icon & Number */}
                    <div className="flex items-center gap-4 lg:w-72 shrink-0">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ 
                          backgroundColor: `${step.color}10`,
                          border: `1px solid ${step.color}25`
                        }}
                      >
                        <Icon className="w-6 h-6" style={{ color: step.color }} />
                      </div>
                      <div>
                        <div className="font-mono text-2xl font-medium text-[#959595]">{step.number}</div>
                        <div className="text-[10px] uppercase tracking-[0.15em] text-[#636363]">{step.phase}</div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className=" text-xl font-medium text-black mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-[#636363] mb-4 leading-relaxed">{step.description}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {step.technologies.map((tech) => (
                          <span 
                            key={tech}
                            className="px-3 py-1 bg-[#ffffff] border border-[rgba(0,0,0,0.08)] rounded-lg 
                                       text-xs font-mono text-[#636363]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="lg:w-48 shrink-0 lg:text-right">
                      <div className="text-[10px] uppercase tracking-[0.15em] text-[#959595] mb-1">
                        {step.metrics.label}
                      </div>
                      <div className="font-mono text-xl font-medium" style={{ color: step.color }}>
                        {step.metrics.value}
                      </div>
                    </div>
                  </div>

                  {/* Connector line */}
                  {index < pipelineSteps.length - 1 && (
                    <div className="hidden lg:block absolute left-[3.5rem] top-full w-px h-4 
                                    bg-gradient-to-b from-[rgba(0,0,0,0.08)] to-transparent" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* System Architecture */}
        <div
          className="bg-white border border-[rgba(0,0,0,0.08)] rounded-3xl p-8 lg:p-10"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Moon className="w-4 h-4 text-black" />
                <span className="text-xs uppercase tracking-[0.2em] text-black">Architecture</span>
              </div>
              <h3 className=" text-2xl font-medium text-black mb-2">
                System Architecture
              </h3>
              <p className="text-sm text-[#636363]">Backend components and their sacred alignment</p>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-40" />
              </div>
              <span className="text-sm font-medium text-emerald-600">Operational</span>
            </div>
          </div>

          <div className="stagger-children grid grid-cols-2 md:grid-cols-4 gap-4">
            {architectureLayers.map((layer, index) => (
              <div
                key={layer.name}
                className="group p-4 bg-[#ffffff] rounded-xl border border-[rgba(0,0,0,0.08)] 
                           hover:border-[#000000]/30 transition-all duration-300"
              >
                <div className="text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: layer.color }}>
                  {layer.name}
                </div>
                <div className="text-sm font-medium text-black mb-2">{layer.tech}</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: layer.color }} />
                  <span className="text-xs text-[#636363]">{layer.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
