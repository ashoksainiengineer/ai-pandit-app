'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, BookOpen, Cpu } from 'lucide-react';

const PILLARS = [
  {
    icon: Shield,
    title: 'Military-Grade Encryption',
    desc: 'Your birth data is encrypted with AES-256-GCM. Each user gets a unique key derived from your identity — we cannot read your data, period.',
  },
  {
    icon: BookOpen,
    title: 'Rooted in Vedic Science',
    desc: 'We use classical Parashara principles, Vimshottari Dasha, Shadbala, and KP Sub-lords — not generic algorithms. Every calculation traces back to authentic texts.',
  },
  {
    icon: Cpu,
    title: 'Powered by AI, Guided by Jyotish',
    desc: 'AI cross-references your life events against millisecond-precise planetary calculations. The result is a rectified birth time with mathematical confidence, not guesswork.',
  },
];

export default function WhyTrustUs() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className=" text-3xl sm:text-4xl font-medium text-[#000000] mb-3">
            Built for Trust
          </h2>
          <p className="text-[#636363] text-sm max-w-md mx-auto">
            Birth data is sacred. We treat it that way.
          </p>
        </motion.div>

        <div className="space-y-8">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex items-start gap-5 p-6 border border-[rgba(0,0,0,0.08)] rounded-xl"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#ffffff] border border-[rgba(0,0,0,0.08)] flex items-center justify-center">
                <p.icon className="w-5 h-5 text-[#8A6A0B]" />
              </div>
              <div>
                <h3 className=" text-lg font-medium text-[#000000] mb-2">
                  {p.title}
                </h3>
                <p className="text-sm text-[#636363] leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
