'use client';

import { motion } from 'framer-motion';

export default function Credibility() {
  const technicalFeatures = [
    'True Node (Rahu/Ketu) for 1-2° accuracy',
    'Lahiri Ayanamsa (Chitrapaksha) precise to 0.001°',
    'Whole Sign house system (Vedic standard)',
    'Classical divisional formulas (D-9, D-10, D-7, D-12, D-30)',
    'Enhanced Shadbala (6-fold planetary strength)',
    'Yoga identification (Raja, Dhana, Arishta)',
    'Robust timezone handling with DST support',
    '6+ decimal precision maintained throughout'
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
            Technical Excellence
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              title: 'Swiss Ephemeris',
              desc: 'NASA-grade planetary positions with 0.001 arc-second accuracy. True Node for Rahu/Ketu precision.'
            },
            {
              title: 'K.N. Rao Method',
              desc: 'Event-based rectification testing 120+ time candidates with 3-phase refinement process'
            },
            {
              title: 'AI-Powered Analysis',
              desc: 'Moonshot AI correlates life events with dasha periods and divisional charts for ±1-2 min accuracy'
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
            Technical Features:
          </h3>
          <ul className="space-y-3">
            {technicalFeatures.map((feature, index) => (
              <li key={index} style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                ✓ {feature}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
