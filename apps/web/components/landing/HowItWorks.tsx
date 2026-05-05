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
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl font-semibold text-[#1A1612] mb-3">
            How It Works
          </h2>
          <p className="text-[#5A554F] text-sm max-w-md mx-auto">
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
              className="relative"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#FDF8F3] border border-[#F0E8DE] flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-[#8A6A0B]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[#8A857F]">Step {step.number}</span>
                  </div>
                  <h3 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-[#1A1612] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#5A554F] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
