'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2 } from 'lucide-react';

const ANALYSIS_STEPS = [
  { label: 'Skyfield ephemeris — calculating planetary positions', done: true },
  { label: 'Vimshottari Dasha periods — cross-referencing events', done: true },
  { label: 'KP Sub-lord precision — narrowing time window', done: false },
  { label: 'Shadbala strength — validating house placements', done: false },
];

export default function AIThinkingBox() {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-3 h-3 bg-black rounded-full animate-pulse" />
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-black/40" />
          <span className="text-sm font-medium text-black/60">AI Analysis Engine</span>
        </div>
      </div>

      <div className="space-y-3">
        {ANALYSIS_STEPS.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            {step.done ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                className="w-4 h-4 rounded-full bg-amber-400 flex-shrink-0"
              />
            )}
            <span className={`text-sm ${step.done ? 'text-black/60' : 'text-black/40'}`}>
              {step.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-5 h-1 bg-black/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-black rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: '50%' }}
          transition={{ duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
