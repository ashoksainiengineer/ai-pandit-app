/**
 * Hero Section
 * Ultra-transparent, high-conversion hero with process visualization
 * Leapcell-inspired design with dark theme and green accent
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Play, ChevronRight } from 'lucide-react';

const stats = [
  { value: '97%', label: 'Accuracy' },
  { value: '20-25', label: 'Minutes' },
  { value: '10K+', label: 'Customers' },
];

const methods = [
  'Vimshottari Dasha',
  'Yogini Dasha', 
  'Chara Dasha',
  'Kalachakra',
  'Ashtakavarga',
  'Shadbala',
  'Varga Charts',
  'Transit Analysis',
  'AI Consensus',
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-[#0a0a0b] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#00DC82]/10 via-[#00DC82]/5 to-transparent rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #27272A 1px, transparent 0)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00DC82]/10 border border-[#00DC82]/20 rounded-full text-[#00DC82] text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              AI + Vedic Astrology Combined
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Discover Your{' '}
              <span className="bg-gradient-to-r from-[#00DC82] to-[#36E4DA] bg-clip-text text-transparent">
                Exact Birth Time
              </span>
              {' '}with 97% Accuracy
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-xl leading-relaxed">
              Our AI analyzes your life events against 9 Vedic validation methods 
              to calculate your precise birth time. Trusted by 10,000+ Indians.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/rectify">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group px-8 py-4 bg-gradient-to-r from-[#00DC82] to-[#36E4DA] text-black font-bold text-lg rounded-xl hover:shadow-[0_0_30px_rgba(0,220,130,0.3)] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Start Analysis - ₹799
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-zinc-900 border border-zinc-700 text-white font-semibold text-lg rounded-xl hover:border-[#00DC82]/30 hover:bg-zinc-800 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </motion.button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-zinc-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Method Showcase */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative bg-[#111113] border border-zinc-800 rounded-2xl p-6 lg:p-8">
              {/* Browser Frame */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="ml-4 flex-1 bg-zinc-900 rounded-lg px-4 py-1.5 text-xs text-zinc-500">
                  aipandit.ai/analysis
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-zinc-400 mb-4">
                  9 Validation Methods Running...
                </div>

                {methods.map((method, index) => (
                  <motion.div
                    key={method}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#00DC82]/20 border border-[#00DC82]/30 flex items-center justify-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="w-2 h-2 rounded-full bg-[#00DC82]"
                      />
                    </div>
                    <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                      {method}
                    </span>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                      className="flex-1 h-px bg-gradient-to-r from-[#00DC82]/30 to-transparent"
                    />
                  </motion.div>
                ))}

                {/* Progress Bar */}
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Analysis Progress</span>
                    <span className="text-sm font-semibold text-[#00DC82]">97% Confidence</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '97%' }}
                      transition={{ delay: 1.5, duration: 1 }}
                      className="h-full bg-gradient-to-r from-[#00DC82] to-[#36E4DA] rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
                className="absolute -bottom-4 -right-4 bg-gradient-to-r from-[#00DC82] to-[#36E4DA] text-black px-4 py-2 rounded-xl font-semibold text-sm shadow-lg"
              >
                ✓ God-Tier Verified
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
