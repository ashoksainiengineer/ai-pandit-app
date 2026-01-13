'use client';

import { motion } from 'framer-motion';

export default function Credibility() {
  const methods = [
    'Tattwa Shodhana (Gender verification)',
    'Divisional Chart Analysis (D-1 to D-60)',
    'Vimshottari Dasha Correlation',
    'Physical Characteristics Matching',
    'Pranapada Lagna Verification'
  ];

  return (
    <section className="py-24 px-6 bg-[var(--bg-surface)]">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 style={{ fontSize: 'var(--text-h2)' }} className="font-bold text-[var(--text-primary)] mb-4">
            Built on Solid Foundations
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              title: 'Swiss Ephemeris',
              desc: 'NASA-grade planetary position data with 0.001 arc-second accuracy'
            },
            {
              title: 'K.N. Rao Method',
              desc: 'Event-based rectification used by professional astrologers'
            },
            {
              title: 'AI Analysis',
              desc: 'Modern AI cross-checks results for accuracy'
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="card"
            >
              <h3 style={{ fontSize: 'var(--text-h4)' }} className="font-semibold text-[var(--text-primary)] mb-3">
                {item.title}
              </h3>
              <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="card-elevated max-w-[700px] mx-auto"
        >
          <h3 style={{ fontSize: 'var(--text-h4)' }} className="font-semibold text-[var(--text-primary)] mb-6">
            Additional Methods Used:
          </h3>
          <ul className="space-y-3">
            {methods.map((method, index) => (
              <li key={index} style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                ✓ {method}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
