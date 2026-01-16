'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Briefcase, Brain, CheckCircle, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: Calendar,
    title: 'Enter Birth Details',
    description: 'Provide your birth date, time estimate, location, and other basic information with our intuitive form.'
  },
  {
    number: 2,
    icon: Briefcase,
    title: 'Add Life Events',
    description: 'List 3+ major life events (marriages, jobs, education, health issues) that have shaped your journey.'
  },
  {
    number: 3,
    icon: Brain,
    title: 'AI Analyzes',
    description: 'Our advanced AI analyzes planetary positions against your life events using Vedic astrology principles.'
  },
  {
    number: 4,
    icon: CheckCircle,
    title: 'Get Results',
    description: 'Receive a detailed 15-20 page analysis with your exact birth time and accuracy confidence score.'
  }
];

export default function Solution() {
  return (
    <section id="how-it-works" className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Four simple steps to discover your exact birth time with AI-powered precision
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-full hover:border-blue-500/50 transition-all duration-300 group">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-600/20 rounded-lg mb-4 group-hover:bg-blue-600/30 transition-colors">
                    <IconComponent className="w-6 h-6 text-blue-400" />
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full">
                      {step.number}
                    </span>
                    <h3 className="text-lg font-semibold text-white">
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-gray-300 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow between steps (hidden on mobile, shown on larger screens) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-blue-500/50" />
                  </div>
                )}

                {/* Mobile arrow indicator */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-4">
                    <ArrowRight className="w-6 h-6 text-blue-500/50" />
                  </div>
                )}
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
          <p className="text-gray-400 mb-8">
            Ready to transform your astrology readings?
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl transition-colors duration-300 shadow-lg hover:shadow-blue-500/25"
          >
            Start Your Analysis Now
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
