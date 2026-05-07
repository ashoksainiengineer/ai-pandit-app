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
  Moon,
  type LucideIcon,
} from 'lucide-react';

export interface PipelineStep {
  number: string;
  phase: string;
  title: string;
  description: string;
  technologies: string[];
  metrics: { label: string; value: string };
  icon: LucideIcon;
  color: string;
}

export interface ArchitectureLayer {
  name: string;
  tech: string;
  status: string;
  color: string;
}

export const pipelineSteps: PipelineStep[] = [
  {
    number: '01',
    phase: 'Initialization',
    title: 'System Bootstrap',
    description: 'Load Skyfield ephemeris, initialize cache, connect to database, validate schema.',
    technologies: ['Skyfield', 'Neon Postgres', 'Drizzle ORM'],
    metrics: { label: 'Cache Size', value: '1000' },
    icon: Server,
    color: '#6B1F7A',
  },
  {
    number: '02',
    phase: 'Stage 1',
    title: 'Exhaustive Data Generation',
    description: 'Generate candidate timestamps with safety net injection. Build data packages with Julian Day and Ayanamsa.',
    technologies: ['Candidate Generator', 'Safety Net', 'Data Package Builder'],
    metrics: { label: 'Candidates', value: '1,440+' },
    icon: Database,
    color: '#8B4A9C',
  },
  {
    number: '03',
    phase: 'Stage 2',
    title: 'Batch Tournament',
    description: 'Split candidates into batches with dynamic sizing. Execute AI calls in parallel and score with Dasha correlation.',
    technologies: ['Batch Splitter', 'Parallel Executor', 'Scoring Engine'],
    metrics: { label: 'Survivors', value: '~435' },
    icon: Workflow,
    color: '#000000',
  },
  {
    number: '04',
    phase: 'Stage 3',
    title: 'Refinement Grid',
    description: 'Generate fine grid around top survivors. Compute D9 Navamsa, D10 Dasamsa, and D60 Shashtyamsa.',
    technologies: ['Grid Generator', 'Varga Calculator', 'Vimsopaka Bala'],
    metrics: { label: 'Refined', value: '310' },
    icon: Layers,
    color: '#4A7C6F',
  },
  {
    number: '05',
    phase: 'Stage 4',
    title: 'Deep Multi-Dasha Analysis',
    description: 'Analyze with Vimshottari, Yogini, Chara, KP System, and Ashtakavarga. Correlate life events.',
    technologies: ['Vimshottari', 'Yogini', 'Chara', 'KP', 'Ashtakavarga'],
    metrics: { label: 'Finalists', value: '21' },
    icon: Star,
    color: '#C65D3B',
  },
  {
    number: '06',
    phase: 'Stage 5',
    title: 'Micro Precision Grid',
    description: 'Generate micro grid at 6-second intervals. Compute D60 deities and detect Bhava Chalit discrepancies.',
    technologies: ['Micro Grid', 'D60 Deities', 'Chalit Detector'],
    metrics: { label: 'Micro', value: '15' },
    icon: Telescope,
    color: '#4A7C6F',
  },
  {
    number: '07',
    phase: 'Stage 6',
    title: 'Final Precision Judgement',
    description: 'Apply God-Tier enhancement with DeepSeek R1. Full astrological context analysis and final verdict extraction.',
    technologies: ['God-Tier Enhancer', 'DeepSeek R1', 'Verdict Extractor'],
    metrics: { label: 'Precision', value: '±15s' },
    icon: Brain,
    color: '#6B1F7A',
  },
  {
    number: '08',
    phase: 'Output',
    title: 'Report Generation',
    description: 'Generate structured response with ephemeris data and divisional charts. Stream via SSE to client.',
    technologies: ['Session Manager', 'Event Emitter', 'Database'],
    metrics: { label: 'Report', value: '23 pages' },
    icon: Zap,
    color: '#000000',
  },
];

export const architectureLayers: ArchitectureLayer[] = [
  { name: 'Frontend', tech: 'Next.js + React', status: 'Streaming UI', color: '#6B1F7A' },
  { name: 'API Gateway', tech: 'Express + TypeScript', status: 'Rate Limited', color: '#8B4A9C' },
  { name: 'Event Stream', tech: 'Session Manager', status: 'SSE Active', color: '#000000' },
  { name: 'BTR Engine', tech: 'Pipeline Processor', status: '6 Stages', color: '#4A7C6F' },
  { name: 'Ephemeris', tech: 'Skyfield', status: 'High Precision', color: '#C65D3B' },
  { name: 'AI Service', tech: 'DeepSeek R1', status: 'Connected', color: '#4A7C6F' },
  { name: 'Database', tech: 'Neon Postgres', status: 'Synced', color: '#000000' },
  { name: 'Progress', tech: 'Progress Tracker', status: 'Active', color: '#B8A1C9' },
];
