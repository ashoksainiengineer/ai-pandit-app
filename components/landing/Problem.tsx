
'use client';

import { motion } from 'framer-motion';
import { HelpCircle, Target, AlertTriangle } from 'lucide-react';

export default function Problem() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-[var(--bg-surface)]">
      <div className="max-w-[1200px] mx-auto">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 style={{ fontSize: 'var(--text-h2)' }} className="font-bold text-[var(--text-primary)] mb-4">
            An Incorrect Birth Time is a Big Problem
          </h2>
          <p style={{ fontSize: 'var(--text-body-lg)', color: 'var(--text-secondary)' }} className="max-w-[700px] mx-auto">
            Even a few minutes of inaccuracy can drastically alter your astrological chart and life predictions.
          </p>
        </motion.div>

        {/* Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {/* Card 1: Wrong Ascendant */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="card"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <h3 style={{ fontSize: 'var(--text-h3)' }} className="font-semibold text-[var(--text-primary)] mb-2">
              Wrong Ascendant
            </h3>
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
              The Ascendant (Lagna) changes roughly every 2 hours. An incorrect time can place you in the wrong rising sign, altering your core identity.
            </p>
          </motion.div>

          {/* Card 2: Inaccurate Houses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="card"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <h3 style={{ fontSize: 'var(--text-h3)' }} className="font-semibold text-[var(--text-primary)] mb-2">
              Inaccurate Houses
            </h3>
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
              The house cusps shift very quickly. This misplaces planets, leading to flawed analysis of wealth, career, and relationships.
            </p>
          </motion.div>

          {/* Card 3: Flawed Dasha Timings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="card"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                <HelpCircle className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <h3 style={{ fontSize: 'var(--text-h3)' }} className="font-semibold text-[var(--text-primary)] mb-2">
              Flawed Dasha Timings
            </h3>
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
              Vimshottari Dasha, the predictive timeline, is highly sensitive to birth time. An error here means all your life event predictions will be wrong.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
