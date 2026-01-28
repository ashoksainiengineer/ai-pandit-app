/**
 * Accuracy Showcase Section
 * Visual demonstration of 95-98% accuracy with comparison charts
 * Shows traditional vs AI-Pandit results
 */

'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { TrendingUp, Award, Target, BarChart3 } from 'lucide-react';

const comparisonData = [
  {
    method: 'Manual Astrologer',
    accuracy: 65,
    time: '3-5 days',
    price: '₹2,000-5,000',
    color: '#71717A',
  },
  {
    method: 'Basic Software',
    accuracy: 75,
    time: '1 hour',
    price: '₹500-1,500',
    color: '#3F3F46',
  },
  {
    method: 'AI Pandit',
    accuracy: 97,
    time: '20-25 min',
    price: '₹799',
    color: '#00DC82',
    highlight: true,
  },
];

const accuracyMetrics = [
  { label: 'Seconds Precision', value: 97, icon: Target },
  { label: 'Method Consensus', value: 95, icon: BarChart3 },
  { label: 'Event Correlation', value: 98, icon: TrendingUp },
  { label: 'Customer Satisfaction', value: 99, icon: Award },
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
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#00DC82]/10 border border-[#00DC82]/20 rounded-full text-[#00DC82] text-sm font-medium mb-6">
            Proven Results
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Unmatched{' '}
            <span className="bg-gradient-to-r from-[#00DC82] to-[#36E4DA] bg-clip-text text-transparent">
              97% Accuracy
            </span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Our AI-powered system consistently outperforms traditional methods 
            through 9-layer validation and deep pattern recognition.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Comparison Chart */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#111113] border border-zinc-800 rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold text-white mb-8">Accuracy Comparison</h3>
            
            <div className="space-y-6">
              {comparisonData.map((item, index) => (
                <div key={item.method} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${item.highlight ? 'text-[#00DC82]' : 'text-zinc-300'}`}>
                        {item.method}
                      </span>
                      {item.highlight && (
                        <span className="px-2 py-0.5 bg-[#00DC82]/20 text-[#00DC82] text-xs rounded-full">
                          Best
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
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
                    <span>{item.time}</span>
                    <span>{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {accuracyMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative bg-[#111113] border border-zinc-800 rounded-2xl p-6 hover:border-[#00DC82]/30 transition-all duration-300"
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
                    <div className="text-sm text-zinc-400">{metric.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-[#00DC82]/10 via-[#00DC82]/5 to-[#00DC82]/10 border border-[#00DC82]/20 rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#00DC82] rounded-full animate-pulse" />
              <span className="text-[#00DC82] font-semibold">Live Status</span>
            </div>
            <div className="h-6 w-px bg-zinc-700" />
            <span className="text-zinc-300">10,000+ Birth Times Rectified</span>
            <div className="h-6 w-px bg-zinc-700" />
            <span className="text-zinc-300">4.9/5 Average Rating</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
