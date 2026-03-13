/**
 * Technology Stack Section
 * Shows all the tools, methods, and technologies used for transparency
 * Builds credibility by showing the complexity behind the system
 */

'use client';

import { motion } from 'framer-motion';
import { 
  Cpu, 
  Database, 
  Globe, 
  Shield, 
  Zap,
  Clock,
  GitBranch,
  CheckCircle2,
  Layers,
  Server
} from 'lucide-react';

const techCategories = [
  {
    title: 'Ephemeris Engine',
    icon: Database,
    description: 'NASA-grade astronomical calculations',
    items: [
      { name: 'Skyfield Ephemeris', detail: 'DE440 planetary data' },
      { name: 'Ayanamsa', detail: 'Lahiri / Raman / KP' },
      { name: 'Planetary Positions', detail: '0.001° precision' },
      { name: 'House Systems', detail: 'Placidus / KP / Whole Sign' },
    ],
    color: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    title: 'Dasha Systems',
    icon: Clock,
    description: '9 Vedic timing techniques analyzed',
    items: [
      { name: 'Vimshottari', detail: '120-year cycle' },
      { name: 'Yogini Dasha', detail: '36-year cycle' },
      { name: 'Chara Dasha', detail: 'Sign-based periods' },
      { name: 'Kalachakra', detail: 'Nakshatra-based' },
    ],
    color: 'from-purple-500/20 to-pink-500/20',
  },
  {
    title: 'Validation Methods',
    icon: CheckCircle2,
    description: '9-layer consensus validation',
    items: [
      { name: 'Ashtakavarga', detail: 'Bindu scoring' },
      { name: 'Shadbala', detail: '6-fold strength' },
      { name: 'Varga Charts', detail: '16 divisionals' },
      { name: 'Transit Analysis', detail: 'Gochara matching' },
    ],
    color: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    title: 'AI Engine',
    icon: Cpu,
    description: 'Deep reasoning on planetary patterns',
    items: [
      { name: 'DeepSeek R1', detail: 'Reasoning model' },
      { name: 'Pattern Matching', detail: 'Event correlation' },
      { name: 'Confidence Scoring', detail: 'Multi-method fusion' },
      { name: 'God-Tier Consensus', detail: '99%+ agreement' },
    ],
    color: 'from-amber-500/20 to-orange-500/20',
  },
];

const infrastructure = [
  { icon: Server, label: 'Node.js Runtime', desc: 'High-performance backend' },
  { icon: Globe, label: 'Global CDN', desc: 'Edge-deployed' },
  { icon: Shield, label: 'AES-256 Encryption', desc: 'Military-grade security' },
  { icon: Zap, label: 'Sub-second API', desc: '<100ms response' },
  { icon: Layers, label: 'Neon Postgres', desc: 'Serverless PostgreSQL' },
  { icon: GitBranch, label: 'Version Control', desc: 'Audit trails' },
];

export function TechnologyStack() {
  return (
    <section className="relative py-24 lg:py-32 bg-[#0a0a0b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#00DC82]/10 border border-[#00DC82]/20 rounded-full text-[#00DC82] text-sm font-medium mb-6">
            Technology Stack
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Powered by{' '}
            <span className="bg-gradient-to-r from-[#00DC82] to-[#36E4DA] bg-clip-text text-transparent">
              Advanced Tech
            </span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            We combine NASA-grade ephemeris data, 9 Vedic validation methods, 
            and modern AI to deliver unmatched accuracy.
          </p>
        </motion.div>

        {/* Tech Categories Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {techCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="relative bg-[#111113] border border-zinc-800 rounded-2xl p-6 lg:p-8 hover:border-[#00DC82]/30 transition-all duration-300 overflow-hidden">
                  {/* Background Glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00DC82]/20 to-transparent border border-[#00DC82]/30 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-[#00DC82]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{category.title}</h3>
                        <p className="text-sm text-zinc-400">{category.description}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="grid grid-cols-2 gap-3">
                      {category.items.map((item, i) => (
                        <div
                          key={i}
                          className="bg-zinc-900/80 rounded-lg p-3 border border-zinc-800/50 hover:border-[#00DC82]/20 transition-colors"
                        >
                          <div className="text-sm font-medium text-white">{item.name}</div>
                          <div className="text-xs text-zinc-500">{item.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Infrastructure Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-white mb-2">Infrastructure & Security</h3>
              <p className="text-sm text-zinc-400">Enterprise-grade reliability for your sacred data</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {infrastructure.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="text-center group"
                  >
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center group-hover:border-[#00DC82]/30 group-hover:bg-[#00DC82]/5 transition-all">
                      <Icon className="w-5 h-5 text-zinc-400 group-hover:text-[#00DC82] transition-colors" />
                    </div>
                    <div className="text-sm font-medium text-white">{item.label}</div>
                    <div className="text-xs text-zinc-500">{item.desc}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
