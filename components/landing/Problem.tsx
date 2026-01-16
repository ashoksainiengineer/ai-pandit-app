'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, AlertTriangle, Target, Zap } from 'lucide-react';

const problems = [
  {
    icon: DollarSign,
    title: 'Expensive Traditional Methods',
    description: 'Astrologers charge ₹2000-5000 and take days to analyze manually. Get professional-grade results instantly.',
    solution: 'AI-powered analysis at just ₹799 with immediate results.'
  },
  {
    icon: AlertTriangle,
    title: 'Manual Calculation Errors',
    description: 'Traditional birth time rectification is prone to human error and subjective interpretation.',
    solution: 'Precise astronomical calculations with mathematical accuracy.'
  },
  {
    icon: Target,
    title: 'Inaccurate Readings',
    description: 'Wrong birth time leads to completely inaccurate predictions and life guidance.',
    solution: '95-98% accuracy ensures reliable astrological insights.'
  },
  {
    icon: Zap,
    title: 'AI vs Human Analysis',
    description: 'AI can process complex planetary relationships faster and more consistently than humans.',
    solution: 'Advanced algorithms analyze events better than manual methods.'
  }
];

export default function Problem() {
  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Your Birth Time Matters
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover why accurate birth time rectification is crucial for meaningful astrology readings
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {problems.map((problem, index) => {
            const IconComponent = problem.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-red-500/30 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-red-600/20 rounded-lg flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-red-400" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {problem.title}
                    </h3>

                    <p className="text-gray-300 text-sm mb-3">
                      {problem.description}
                    </p>

                    <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
                      <p className="text-blue-300 text-sm">
                        <strong>Solution:</strong> {problem.solution}
                      </p>
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
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-blue-600/10 to-blue-700/10 border border-blue-600/20 rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Transform Your Astrology Journey
            </h3>
            <p className="text-gray-300 text-lg mb-6">
              Don't let inaccurate birth time hold back your astrological insights.
              Get the precision you deserve with AI-powered analysis.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl transition-colors duration-300 shadow-lg hover:shadow-blue-500/25"
            >
              Get Accurate Results Now
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
