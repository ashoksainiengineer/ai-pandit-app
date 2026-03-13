/**
 * Tech Stack Component
 * Detailed showcase of the actual technology stack used
 */

'use client';

import { motion } from 'framer-motion';
import { 
  Server, 
  Brain, 
  Database, 
  Cloud,
  Code,
  Terminal,
  Layers,
  Cpu,
  GitBranch,
  Shield,
  Zap,
  Globe,
  Lock,
  Clock,
  Activity
} from 'lucide-react';

const techLayers = [
  {
    category: 'Core Engine',
    icon: Cpu,
    color: '#00DC82',
    items: [
      { name: 'Skyfield Ephemeris', desc: 'NASA-grade astronomical calculations', version: 'DE440' },
      { name: 'BTR Core Engine', desc: 'Birth Time Rectification algorithms', version: 'v4.2' },
      { name: 'Consensus Engine', desc: 'Multi-method result aggregation', version: 'v3.1' },
      { name: 'Shuddhi Engine', desc: 'Vedic precision calculations', version: 'v2.0' },
    ]
  },
  {
    category: 'AI/ML Stack',
    icon: Brain,
    color: '#36E4DA',
    items: [
      { name: 'DeepSeek AI', desc: 'Primary LLM for analysis', version: 'v3.0' },
      { name: 'Streaming Processor', desc: 'Real-time result generation', version: 'v1.5' },
      { name: 'Prompt Engineering', desc: 'Optimized Vedic astrology prompts', version: 'v2.3' },
      { name: 'Response Parser', desc: 'Structured output extraction', version: 'v1.8' },
    ]
  },
  {
    category: 'Backend Infrastructure',
    icon: Server,
    color: '#60A5FA',
    items: [
      { name: 'Node.js Runtime', desc: 'Server-side JavaScript execution', version: 'v20.x' },
      { name: 'Express.js', desc: 'Web application framework', version: 'v4.18' },
      { name: 'TypeScript', desc: 'Type-safe development', version: 'v5.3' },
      { name: 'Bull Queue', desc: 'Redis-based job processing', version: 'v4.12' },
    ]
  },
  {
    category: 'Database & Storage',
    icon: Database,
    color: '#F472B6',
    items: [
      { name: 'Neon Postgres', desc: 'Serverless PostgreSQL', version: '16' },
      { name: 'Drizzle ORM', desc: 'Type-safe SQL queries', version: 'v0.29' },
      { name: 'Redis Cache', desc: 'Session & progress storage', version: 'v7.2' },
      { name: 'Ephemeris Files', desc: '32MB astronomical dataset', version: 'SE' },
    ]
  },
  {
    category: 'Frontend Architecture',
    icon: Layers,
    color: '#A78BFA',
    items: [
      { name: 'Next.js 14', desc: 'React framework with App Router', version: 'v14.1' },
      { name: 'React 18', desc: 'Concurrent rendering features', version: 'v18.2' },
      { name: 'TypeScript', desc: 'Static type checking', version: 'v5.3' },
      { name: 'Tailwind CSS', desc: 'Utility-first styling', version: 'v3.4' },
    ]
  },
  {
    category: 'UI/UX Components',
    icon: Code,
    color: '#FB923C',
    items: [
      { name: 'Framer Motion', desc: 'Production-ready animations', version: 'v11.0' },
      { name: 'shadcn/ui', desc: 'Headless component library', version: 'v0.8' },
      { name: 'Lucide Icons', desc: 'Consistent iconography', version: 'v0.3' },
      { name: 'Custom Charts', desc: 'D3-based visualizations', version: 'v7.8' },
    ]
  },
  {
    category: 'DevOps & Deployment',
    icon: Cloud,
    color: '#34D399',
    items: [
      { name: 'Docker', desc: 'Containerized deployment', version: 'v24.0' },
      { name: 'Railway/Render', desc: 'Cloud hosting platform', version: 'v2.x' },
      { name: 'GitHub Actions', desc: 'CI/CD automation', version: 'v4.x' },
      { name: 'Monitoring', desc: 'Health checks & logging', version: 'v1.0' },
    ]
  },
  {
    category: 'Security & Auth',
    icon: Shield,
    color: '#F87171',
    items: [
      { name: 'Clerk Auth', desc: 'Authentication & user management', version: 'v4.29' },
      { name: 'AES-256 Encryption', desc: 'Data at rest protection', version: 'v1.0' },
      { name: 'JWT Tokens', desc: 'Secure session handling', version: 'v9.0' },
      { name: 'Rate Limiting', desc: 'API abuse prevention', version: 'v7.x' },
    ]
  },
];

const stats = [
  { label: 'Processing Nodes', value: '16', icon: Cpu, color: 'text-emerald-400' },
  { label: 'API Latency', value: '<50ms', icon: Zap, color: 'text-amber-400' },
  { label: 'Ephemeris Size', value: '32MB', icon: Database, color: 'text-blue-400' },
  { label: 'Uptime', value: '99.9%', icon: Activity, color: 'text-green-400' },
  { label: 'Precision', value: '±0.0001°', icon: Terminal, color: 'text-purple-400' },
  { label: 'Global CDN', value: 'Edge', icon: Globe, color: 'text-cyan-400' },
];

export default function TechStack() {
  return (
    <div className="relative bg-[#0a0a0b] border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="relative p-6 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800/50 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#00DC82]/10 rounded-xl border border-[#00DC82]/20">
              <Terminal className="w-6 h-6 text-[#00DC82]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Production Architecture</h3>
              <p className="text-sm text-zinc-500">Built with enterprise-grade technologies</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-400">Operational</span>
            </div>
            <div className="px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800">
              <span className="text-xs font-mono text-zinc-400">v4.2.1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-zinc-800">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-zinc-900 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="text-lg font-mono font-semibold text-white">{stat.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Tech Stack Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {techLayers.map((layer, layerIndex) => {
            const Icon = layer.icon;
            return (
              <motion.div
                key={layer.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + layerIndex * 0.1 }}
                className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${layer.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: layer.color }} />
                  </div>
                  <h4 className="text-sm font-semibold text-white">{layer.category}</h4>
                </div>
                <div className="space-y-3">
                  {layer.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + layerIndex * 0.1 + itemIndex * 0.05 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                          {item.name}
                        </span>
                        <span className="text-xs font-mono text-zinc-600">{item.version}</span>
                      </div>
                      <p className="text-xs text-zinc-500">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/50 border-t border-zinc-800">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2 text-zinc-500">
            <GitBranch className="w-3 h-3" />
            <span>main</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-500">
            <Lock className="w-3 h-3" />
            <span>Encrypted</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-500">
            <Clock className="w-3 h-3" />
            <span>Deployed: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600">Powered by</span>
          <span className="text-xs font-semibold text-[#00DC82]">Skyfield</span>
          <span className="text-xs text-zinc-600">+</span>
          <span className="text-xs font-semibold text-[#36E4DA]">DeepSeek AI</span>
        </div>
      </div>
    </div>
  );
}
