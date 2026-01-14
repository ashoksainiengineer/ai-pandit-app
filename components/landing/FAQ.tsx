'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How accurate is the rectification?',
      a: 'With 10+ life events, we achieve ±1-2 minute accuracy. The system tests 120+ time candidates using 3-phase refinement (2-min → 30-sec → 5-sec intervals). Confidence score is based on event-dasha correlation strength.'
    },
    {
      q: 'What makes this system technically superior?',
      a: 'We use True Node (not Mean Node) for Rahu/Ketu, precise Lahiri ayanamsa, Whole Sign houses, classical divisional formulas, enhanced Shadbala calculations, and robust timezone handling with DST support. All calculations maintain 6+ decimal precision.'
    },
    {
      q: 'How many life events do I need?',
      a: 'Minimum 5 events required. Best results with 10+ events: marriage, children birth, career milestones, education, health events, property purchases. Each event is correlated with Vimshottari dasha and divisional charts.'
    },
    {
      q: 'What astrological methods are used?',
      a: 'K.N. Rao event-based method, Vimshottari Dasha correlation, divisional chart analysis (D-9 for marriage, D-10 for career, D-7 for children), Shadbala (6-fold strength), yoga identification (Raja, Dhana, Arishta), and house lord verification.'
    },
    {
      q: 'How does the AI scoring work?',
      a: 'AI analyzes each life event against dasha periods, checks divisional chart placements, verifies house lord strength, identifies yogas, and detects impossible scenarios. Scoring is consistent (temperature 0.3) with detailed reasoning provided.'
    }
  ];

  return (
    <section id="faq" className="py-24 px-6 bg-[var(--bg-surface)]">
      <div className="max-w-[800px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 style={{ fontSize: 'var(--text-h2)' }} className="font-bold text-[var(--text-primary)] mb-4">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
              className="border border-[var(--border-default)] rounded-lg overflow-hidden hover:border-[var(--border-strong)] transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-hover)] transition-colors"
              >
                <span style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
                  {faq.q}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={20} style={{ color: 'var(--text-secondary)' }} />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-[var(--border-default)]"
                  >
                    <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }} className="px-6 py-4">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
