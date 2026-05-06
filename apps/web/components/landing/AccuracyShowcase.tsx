/**
 * Accuracy Showcase Section - Sacred Ivory Edition
 * Elegant precision metrics with warm colors
 */

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
    color: '#959595',
  },
  {
    method: 'Basic Software',
    accuracy: 75,
    precision: '±2-5 min',
    methods: '3-4',
    time: '1 hour',
    color: '#636363',
  },
  {
    method: 'AI Pandit BTR',
    accuracy: 97.3,
    precision: '±15 sec',
    methods: '10+',
    time: '20-25 min',
    color: '#000000',
    highlight: true,
  },
];

const technicalMetrics = [
  { label: 'Calculation Precision', value: 99.9, icon: Target, desc: 'IEEE 754 double-precision', color: '#6B1F7A' },
  { label: 'Method Consensus', value: 97.3, icon: BarChart3, desc: '10+ validation methods', color: '#000000' },
  { label: 'Event Correlation', value: 98.7, icon: TrendingUp, desc: 'Pattern matching score', color: '#4A7C6F' },
  { label: 'Processing Speed', value: 99.5, icon: Zap, desc: 'Sub-second calculations', color: '#C65D3B' },
];

function StaticBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-3 bg-[rgba(0,0,0,0.08)] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${value}%`,
          backgroundColor: color,
          boxShadow: `0 0 20px ${color}30`
        }}
      />
    </div>
  );
}

export function AccuracyShowcase() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Soft Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-amber-100/30 rounded-full blur-3xl" />

        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #000000 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
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
            <Terminal className="w-4 h-4 text-[#000000]" />
            <span className="text-[#636363]">Precision Metrics</span>
          </div>

          <h2 className=" text-3xl md:text-4xl lg:text-5xl 
                     font-medium text-[#000000] mb-6 leading-tight">
            Divine{' '}
            <span className="text-[#000000]">Precision</span>
            {' '}Engineering
          </h2>

          <p className="text-lg text-[#636363] max-w-3xl mx-auto">
            Skyfield ephemeris calculations with IEEE 754 double-precision arithmetic.
            Achieving sub-arcsecond accuracy through algorithmic consensus.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Precision Comparison Chart */}
          <div
            className="bg-white border border-[rgba(0,0,0,0.08)] rounded-3xl p-8"
          >
            <div className="flex items-center justify-between mb-10">
              <h3 className=" text-xl font-medium text-[#000000]">
                Accuracy Comparison
              </h3>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#ffffff] rounded-lg border border-[rgba(0,0,0,0.08)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-[#636363]">Validated</span>
              </div>
            </div>

            <div className="space-y-8">
              {precisionMetrics.map((item, index) => (
                <div key={item.method} className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${item.highlight ? 'text-[#000000]' : 'text-[#636363]'}`}>
                        {item.method}
                      </span>
                      {item.highlight && (
                        <span className="px-2 py-0.5 bg-[#000000]/10 border border-[#000000]/30 
                                     text-[#000000] text-xs rounded-full font-medium">
                          Divine
                        </span>
                      )}
                    </div>
                    <span className={`text-2xl font-medium ${item.highlight ? 'text-[#000000]' : 'text-[#636363]'}`}>
                      {item.accuracy}%
                    </span>
                  </div>

                  <StaticBar
                    value={item.accuracy}
                    color={item.color}
                  />

                  <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
                    <div>
                      <span className="text-[#959595]">Precision:</span>
                      <span className="ml-2 text-[#636363]">{item.precision}</span>
                    </div>
                    <div>
                      <span className="text-[#959595]">Methods:</span>
                      <span className="ml-2 text-[#636363]">{item.methods}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#959595]">Time:</span>
                      <span className="ml-2 text-[#636363]">{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Technical Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {technicalMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="group relative bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-6 
                         hover:border-[#000000]/30 transition-all duration-300"
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

                    <div className="font-mono text-4xl font-medium text-[#000000] mb-2">
                      {metric.value}%
                    </div>
                    <div className="text-sm font-medium text-[#636363] mb-1">{metric.label}</div>
                    <div className="text-xs text-[#636363]">{metric.desc}</div>
                  </div>
                </div>
              );
            })}

            {/* Calculation Detail Card */}
            <div
              className="col-span-2 bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-[#000000]/10 rounded-lg border border-[#000000]/20">
                  <Terminal className="w-5 h-5 text-[#000000]" />
                </div>
                <h4 className=" text-sm font-medium text-[#000000]">
                  Calculation Pipeline
                </h4>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-4 bg-[#ffffff] rounded-xl border border-[rgba(0,0,0,0.08)]">
                  <div className="text-[#636363] mb-2">Ephemeris</div>
                  <div className="text-[#000000] text-sm mb-1">DE440</div>
                  <div className="text-[#959595]">32MB dataset</div>
                </div>
                <div className="p-4 bg-[#ffffff] rounded-xl border border-[rgba(0,0,0,0.08)]">
                  <div className="text-[#636363] mb-2">Precision</div>
                  <div className="text-[#000000] text-sm mb-1">±0.0001°</div>
                  <div className="text-[#959595]">0.36 arcseconds</div>
                </div>
                <div className="p-4 bg-[#ffffff] rounded-xl border border-[rgba(0,0,0,0.08)]">
                  <div className="text-[#636363] mb-2">Candidates</div>
                  <div className="text-[#000000] text-sm mb-1">1,440</div>
                  <div className="text-[#959595]">per analysis</div>
                </div>
                <div className="p-4 bg-[#ffffff] rounded-xl border border-[rgba(0,0,0,0.08)]">
                  <div className="text-[#636363] mb-2">Confidence</div>
                  <div className="text-[#000000] text-sm mb-1">97.3%</div>
                  <div className="text-[#959595]">Divine verified</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div
          className="mt-20 flex justify-center"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-4 px-8 py-4 
                      bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-40" />
              </div>
              <span className="text-emerald-600 text-sm font-medium">System Operational</span>
            </div>

            <div className="hidden sm:block h-5 w-px bg-[rgba(0,0,0,0.08)]" />

            <div className="flex items-center gap-2 text-sm text-[#636363]">
              <Activity className="w-4 h-4" />
              <span>{'API Latency: <50ms'}</span>
            </div>

            <div className="hidden sm:block h-5 w-px bg-[rgba(0,0,0,0.08)]" />

            <div className="flex items-center gap-2 text-sm text-[#636363]">
              <Database className="w-4 h-4" />
              <span>Ephemeris: Synced</span>
            </div>

            <div className="hidden sm:block h-5 w-px bg-[rgba(0,0,0,0.08)]" />

            <div className="flex items-center gap-2 text-sm text-[#636363]">
              <Cpu className="w-4 h-4" />
              <span>AI: Connected</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
