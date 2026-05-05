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
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl font-semibold text-slate-800 mb-3">
            Built for Trust
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Birth data is sacred. We treat it that way.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="text-center p-6"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 mb-5">
                <p.icon className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-slate-800 mb-2">
                {p.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
