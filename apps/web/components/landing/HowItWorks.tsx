'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, User, Sparkles } from 'lucide-react';

const STEPS = [
  {
    icon: FileText,
    title: 'Enter Birth Details',
    desc: 'Share your birth date, approximate time, and place. Add a few key life events you remember.',
    number: '1',
  },
  {
    icon: User,
    title: 'Describe Yourself',
    desc: 'Answer 3 simple questions about your natural body type. No mirror analysis or confusion needed.',
    number: '2',
  },
  {
    icon: Sparkles,
    title: 'Get Your Rectified Time',
    desc: 'Our Vedic engine cross-references your data against planetary positions to find your precise birth moment.',
    number: '3',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-[#FFFCF8]">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl font-semibold text-slate-800 mb-3">
            How It Works
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Three simple steps to discover your precise birth time.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 mb-5">
                <step.icon className="w-7 h-7 text-amber-700" />
              </div>
              <div className="absolute top-2 -left-2 w-7 h-7 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                {step.number}
              </div>
              <h3 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-slate-800 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
