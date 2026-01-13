'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 style={{ fontSize: 'var(--text-h2)' }} className="font-bold text-[var(--text-primary)] mb-4">
            Simple, Transparent Pricing
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[800px] mx-auto mb-8">
          {/* Basic Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="card-elevated"
          >
            <h3 style={{ fontSize: 'var(--text-h3)' }} className="font-bold text-[var(--text-primary)] mb-2">
              BASIC
            </h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>₹499</span>
              <span style={{ fontSize: 'var(--text-small)', color: 'var(--text-muted)' }}>one-time</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Rectified time',
                'Confidence score',
                'Basic chart',
                'Event verification'
              ].map((item, index) => (
                <li key={index} style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                  ✓ {item}
                </li>
              ))}
            </ul>
            <Link href="/rectify" className="btn btn-secondary w-full">
              Get Started
            </Link>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            viewport={{ once: true }}
            className="card-elevated border-2"
            style={{ borderColor: 'var(--accent-primary)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span style={{ fontSize: 'var(--text-body)', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                ⭐ RECOMMENDED
              </span>
            </div>
            <h3 style={{ fontSize: 'var(--text-h3)' }} className="font-bold text-[var(--text-primary)] mb-2">
              PRO
            </h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>₹999</span>
              <span style={{ fontSize: 'var(--text-small)', color: 'var(--text-muted)' }}>one-time</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Everything in Basic',
                'All 16 Varga charts',
                'Dasha predictions',
                'PDF report',
                '30-day revision'
              ].map((item, index) => (
                <li key={index} style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                  ✓ {item}
                </li>
              ))}
            </ul>
            <Link href="/rectify" className="btn btn-primary w-full">
              Get Pro →
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-muted)' }}>
            🔒 Secure Payment • 💬 WhatsApp Support • ✓ Money-back guarantee
          </p>
        </motion.div>
      </div>
    </section>
  );
}
