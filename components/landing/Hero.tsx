'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      <div className="max-w-[800px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Headline */}
          <h1 style={{ fontSize: 'var(--text-display)' }} className="font-bold text-[var(--text-primary)] tracking-tight mb-6">
            Don't Know Your<br />
            <span style={{ color: 'var(--accent-primary)' }}>Exact Birth Time?</span>
          </h1>

          {/* Subheadline */}
          <p style={{ fontSize: 'var(--text-body-lg)', color: 'var(--text-secondary)' }} className="max-w-[600px] mx-auto mb-10">
            We'll find it. Using Vedic astrology principles, Swiss Ephemeris calculations, and AI-powered analysis.
          </p>

          {/* CTA Button */}
          <Link href="/rectify" className="btn btn-primary text-lg px-10 h-14 mb-8 inline-flex">
            Find My Birth Time
            <ArrowRight className="w-5 h-5" />
          </Link>

          {/* Trust indicator */}
          <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-muted)' }} className="mb-12">
            ⭐ Trusted by 14,000+ users across India
          </p>

          {/* Demo card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-elevated max-w-[400px] mx-auto"
          >
            <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-muted)' }} className="mb-4">
              Example Result
            </p>
            <div className="flex justify-between items-center mb-3">
              <span style={{ color: 'var(--text-secondary)' }}>Your estimate:</span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>~10:15 AM (±2hrs)</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span style={{ color: 'var(--text-secondary)' }}>Rectified time:</span>
              <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '1.125rem' }}>
                10:23:47 AM
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-secondary)' }}>Confidence:</span>
              <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>94%</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
