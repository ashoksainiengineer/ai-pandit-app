'use client';

import { motion } from 'framer-motion';

export default function Problem() {
  const cards = [
    {
      icon: '⏱️',
      title: 'Dasha Timing Shifts',
      body: 'Even 10 minutes wrong can shift your Mahadasha start dates by months. Life events won\'t match predictions.'
    },
    {
      icon: '♌',
      title: 'Lagna Sign Changes',
      body: 'Lagna changes every 2 hours. Wrong Lagna = wrong personality reading, wrong house placements, everything off.'
    },
    {
      icon: '📊',
      title: 'Divisional Charts Fail',
      body: 'D-9 (Navamsa) changes every 13 minutes. D-60 changes every 2 minutes. Fine-tuning is impossible with wrong time.'
    }
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
            Why Birth Time Matters
          </h2>
          <p style={{ fontSize: 'var(--text-body-lg)', color: 'var(--text-secondary)' }} className="max-w-[600px] mx-auto">
            A 4-minute error shifts your Lagna by 1 degree. Here's what that means for your chart readings:
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 style={{ fontSize: 'var(--text-h4)' }} className="font-semibold text-[var(--text-primary)] mb-3">
                {card.title}
              </h3>
              <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                {card.body}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="card-elevated max-w-[700px] mx-auto mt-16"
        >
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', fontStyle: 'italic' }} className="mb-4">
            "I got my kundli made 5 times. Each astrologer gave different predictions because my birth time was wrong."
          </p>
          <p style={{ fontSize: 'var(--text-small)', color: 'var(--text-muted)' }}>
            — Priya S., Mumbai
          </p>
        </motion.div>
      </div>
    </section>
  );
}
