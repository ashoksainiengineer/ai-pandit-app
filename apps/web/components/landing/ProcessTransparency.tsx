/**
 * Process Transparency Section
 * Shows the 4 Yuga stages of analysis with full technical details
 * Maximum transparency to build trust and convert users
 */

'use client';

import { motion } from 'framer-motion';
import { Clock, Search, Target, CheckCircle2, ChevronRight } from 'lucide-react';

const yugas = [
  {
    name: 'Satya Yuga',
    subtitle: 'The Age of Coarse Sweep',
    icon: Search,
    timeRange: '±12 hours',
    gridSize: '30-minute intervals',
    candidates: '48 candidates generated',
    description: 'We begin with a wide sweep covering your entire tentative time window. Every 30-minute interval becomes a candidate for analysis.',
    techniques: [
      'Swiss Ephemeris planetary positions',
      'Basic Dasha period matching',
      'Rashi compatibility check',
    ],
    color: 'from-emerald-500/20 to-teal-500/20',
    duration: '~2 minutes',
  },
  {
    name: 'Treta Yuga',
    subtitle: 'The Age of Refinement',
    icon: Clock,
    timeRange: '±2 hours',
    gridSize: '5-minute intervals',
    candidates: '24 candidates selected',
    description: 'Top 50% candidates advance. We narrow the search to 5-minute precision, eliminating obvious mismatches.',
    techniques: [
      'Vimshottari Dasha deep analysis',
      'Yogini Dasha correlation',
      'Transit-to-event matching',
    ],
    color: 'from-cyan-500/20 to-blue-500/20',
    duration: '~4 minutes',
  },
  {
    name: 'Dvapara Yuga',
    subtitle: 'The Age of Fine Precision',
    icon: Target,
    timeRange: '±30 minutes',
    gridSize: '1-minute intervals',
    candidates: '12 candidates remaining',
    description: 'Only the strongest candidates survive. We analyze at 1-minute precision using advanced Vedic techniques.',
    techniques: [
      'Chara Dasha (Sign-based periods)',
      'Kalachakra Dasha analysis',
      'Ashtakavarga scoring',
    ],
    color: 'from-blue-500/20 to-indigo-500/20',
    duration: '~6 minutes',
  },
  {
    name: 'Kali Yuga',
    subtitle: 'The Age of Micro Precision',
    icon: CheckCircle2,
    timeRange: '±5 minutes',
    gridSize: 'Seconds precision',
    candidates: '3-5 finalists',
    description: 'The final battle. AI analyzes seconds-level precision to crown the true birth time with God-Tier confidence.',
    techniques: [
      'AI Consensus Engine (9 methods)',
      'Shodashavarga (16 divisional charts)',
      'Shadbala (6-fold strength)',
      'God-Tier validation',
    ],
    color: 'from-violet-500/20 to-purple-500/20',
    duration: '~8 minutes',
  },
];

export function ProcessTransparency() {
  return (
    <section className="relative py-24 lg:py-32 bg-[#0a0a0b] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#00DC82]/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 lg:mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#00DC82]/10 border border-[#00DC82]/20 rounded-full text-[#00DC82] text-sm font-medium mb-6">
            Full Process Transparency
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            The{' '}
            <span className="bg-gradient-to-r from-[#00DC82] to-[#36E4DA] bg-clip-text text-transparent">
              4 Yuga Process
            </span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Just like the cosmic cycles, we analyze your birth time through 4 progressive stages of precision. 
            Each Yuga eliminates weaker candidates until only the truth remains.
          </p>
        </motion.div>

        {/* Process Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#00DC82]/50 via-[#36E4DA]/30 to-transparent hidden md:block" />

          <div className="space-y-12 lg:space-y-16">
            {yugas.map((yuga, index) => {
              const Icon = yuga.icon;
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={yuga.name}
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative flex flex-col lg:flex-row items-start gap-8 ${
                    isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Timeline Node */}
                  <div className="absolute left-0 lg:left-1/2 lg:-translate-x-1/2 w-16 h-16 flex items-center justify-center z-10">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${yuga.color} border border-[#00DC82]/30 flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-[#00DC82]" />
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className={`ml-20 lg:ml-0 lg:w-[45%] ${isEven ? 'lg:pr-16' : 'lg:pl-16'}`}>
                    <div className="group relative bg-[#111113] border border-zinc-800 rounded-2xl p-6 lg:p-8 hover:border-[#00DC82]/30 transition-all duration-300">
                      {/* Glow Effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${yuga.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl -z-10`} />

                      {/* Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs font-semibold text-[#00DC82] uppercase tracking-wider">
                          Stage {index + 1}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-xs text-zinc-500">{yuga.duration}</span>
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-1">{yuga.name}</h3>
                      <p className="text-zinc-400 text-sm mb-4">{yuga.subtitle}</p>

                      {/* Specs Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-zinc-900/50 rounded-lg p-3">
                          <div className="text-xs text-zinc-500 mb-1">Search Range</div>
                          <div className="text-sm font-semibold text-white">{yuga.timeRange}</div>
                        </div>
                        <div className="bg-zinc-900/50 rounded-lg p-3">
                          <div className="text-xs text-zinc-500 mb-1">Grid Size</div>
                          <div className="text-sm font-semibold text-white">{yuga.gridSize}</div>
                        </div>
                      </div>

                      <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                        {yuga.description}
                      </p>

                      {/* Techniques Used */}
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                          Techniques Applied
                        </div>
                        {yuga.techniques.map((technique, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                            <ChevronRight className="w-4 h-4 text-[#00DC82]" />
                            {technique}
                          </div>
                        ))}
                      </div>

                      {/* Candidates Badge */}
                      <div className="mt-6 pt-6 border-t border-zinc-800">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-500">Candidates After Stage</span>
                          <span className="text-lg font-bold text-[#00DC82]">{yuga.candidates}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
