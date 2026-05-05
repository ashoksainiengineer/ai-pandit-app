'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'How does birth time rectification work?',
    a: 'We use your birth details, life events, and natural body type to narrow down your birth time window. The Vedic engine cross-references your life events against Vimshottari Dasha periods to find which birth time best explains when those events happened in your life.',
  },
  {
    q: 'How many life events should I provide?',
    a: 'At least 3 significant events with reasonably accurate dates. Events like marriage, first job, graduation, major relocation, or health events work best. More precise dates lead to more accurate results.',
  },
  {
    q: 'Is my birth data safe?',
    a: 'Yes. All data is encrypted with AES-256-GCM before storage. Your encryption key is derived from your unique user identity — even we cannot read your data. We never share information with third parties.',
  },
  {
    q: 'Do I need astrology knowledge to use this?',
    a: 'Not at all. You just need to know your birth details and a few life events. The system handles all the astrological calculations automatically. No prior knowledge of Jyotish is required.',
  },
];

export default function FAQ() {
  return (
    <section className="py-20 bg-[#FFFCF8]">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl font-semibold text-slate-800 mb-2">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group bg-white border border-amber-200/50 rounded-xl overflow-hidden"
            >
              <summary className="px-5 py-4 text-slate-700 font-medium cursor-pointer flex items-center justify-between hover:bg-amber-50/50 transition-colors list-none text-sm sm:text-base">
                <span className="pr-4">{faq.q}</span>
                <ChevronDown className="w-4 h-4 text-amber-500 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="border-t border-amber-100 px-5 py-4 text-sm text-slate-500 leading-relaxed">
                {faq.a}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}
