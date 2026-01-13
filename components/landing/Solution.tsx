'use client';

import { motion } from 'framer-motion';

export default function Solution() {
  const steps = [
    { num: 1, title: 'You Share Birth Info', time: '~5 minutes', desc: 'Approximate time, place, date you know' },
    { num: 2, title: 'You Add Life Events', time: '~10 minutes', desc: 'Marriage, job, children, major events' },
    { num: 3, title: 'We Calculate & Verify', time: '~30 seconds', desc: 'AI analyzes event-dasha correlations' },
    { num: 4, title: 'You Get Results', time: 'Instant', desc: 'Exact birth time with confidence %' }
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 style={{ fontSize: 'var(--text-h2)' }} className="font-bold text-[var(--text-primary)] mb-4">
            How We Find Your Exact Time
          </h2>
          <p style={{ fontSize: 'var(--text-body-lg)', color: 'var(--text-secondary)' }} className="max-w-[700px] mx-auto">
            Our method combines ancient Vedic wisdom with modern precision.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-2">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <div className="card w-full">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-primary)] text-[var(--bg-base)] font-bold mb-4 mx-auto">
                  {step.num}
                </div>
                <h3 style={{ fontSize: 'var(--text-h4)' }} className="font-semibold text-[var(--text-primary)] text-center mb-2">
                  {step.title}
                </h3>
                <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-muted)' }} className="text-center mb-3">
                  {step.time}
                </p>
                <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)' }} className="text-center">
                  {step.desc}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block h-1 w-8 bg-[var(--accent-primary)] mt-4"></div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
