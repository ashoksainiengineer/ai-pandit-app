'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How accurate is the rectification?',
      a: 'With 5+ life events, we achieve 85-95% confidence. More events = higher accuracy. We always show you the confidence score so you know exactly how reliable the result is.'
    },
    {
      q: 'What if I don\'t know any events with exact dates?',
      a: 'That\'s okay! Month/year is often enough for major events like marriage, first job, or graduation. Even approximate dates help narrow down the search range.'
    },
    {
      q: 'How many life events do I need?',
      a: 'Minimum 3, recommended 5-7. Best events: marriage date, first child birth, parent\'s death, major surgery, first job. Marriage is typically the most reliable anchor.'
    },
    {
      q: 'What methods do you use?',
      a: 'We combine K.N. Rao\'s event-based method, Vimshottari Dasha correlation, divisional chart analysis (D-1 to D-60), Tattwa Shodhana, and physical characteristics verification.'
    },
    {
      q: 'Is my data safe and private?',
      a: 'Yes. Your data is encrypted and never shared. We only use it for rectification. You can request deletion anytime.'
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
