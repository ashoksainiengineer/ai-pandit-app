'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BirthData, LifeEvent } from '@/lib/types';

interface Step4ReviewProps {
  data: BirthData;
  events: LifeEvent[];
  onSubmit: () => void;
  isSubmitting: boolean;
  onEdit: (step: number) => void;
  offsetConfig?: unknown;
}

export default function Step4Review({
  data,
  events,
  onSubmit,
  isSubmitting,
  onEdit,
  offsetConfig,
}: Step4ReviewProps) {

  return (
    <>
      {/* Security Badge — matches Step 1 & Step 2 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2 text-xs text-[#184131] bg-[#184131]/5 py-2 px-4 rounded-full border border-[#184131]/10"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="font-medium">End-to-End Encrypted</span>
      </motion.div>

      {/* Header — matches Step 1 & Step 2 */}
      <div className="text-center my-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ffffff] to-white border border-[rgba(0,0,0,0.08)] rounded-full text-xs mb-6 shadow-sm"
        >
          <span className="text-black font-medium tracking-wider">STEP 3 OF 3</span>
        </motion.div>
        <motion.h1
          className="text-3xl sm:text-4xl font-medium text-black leading-tight mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Review <span className="text-black">Your Information</span>
        </motion.h1>
        <motion.p
          className="text-sm text-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Please verify your details before submitting for analysis
        </motion.p>
      </div>

      {/* Birth Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-6 border border-black/5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-black">Birth Details</h3>
          <button
            onClick={() => onEdit(1)}
            className="text-xs text-black/50 hover:text-black font-medium transition-colors"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-[var(--prism-canvas)] rounded-lg p-3">
            <span className="text-black/40 text-xs">Full Name</span>
            <p className="text-black font-medium mt-0.5">{data.fullName || '—'}</p>
          </div>
          <div className="bg-[var(--prism-canvas)] rounded-lg p-3">
            <span className="text-black/40 text-xs">Date of Birth</span>
            <p className="text-black font-medium mt-0.5">{data.dateOfBirth || '—'}</p>
          </div>
          <div className="bg-[var(--prism-canvas)] rounded-lg p-3">
            <span className="text-black/40 text-xs">Birth Time</span>
            <p className="text-black font-medium mt-0.5">{data.tentativeTime || '—'}</p>
          </div>
          <div className="bg-[var(--prism-canvas)] rounded-lg p-3">
            <span className="text-black/40 text-xs">Birth Place</span>
            <p className="text-black font-medium mt-0.5">{data.birthPlace || '—'}</p>
          </div>
          <div className="bg-[var(--prism-canvas)] rounded-lg p-3">
            <span className="text-black/40 text-xs">Gender</span>
            <p className="text-black font-medium mt-0.5">{data.gender || '—'}</p>
          </div>
        </div>
      </motion.div>

      {/* Life Events Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 bg-white rounded-xl p-6 border border-black/5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-black">
            Life Events ({events.length})
          </h3>
          <button
            onClick={() => onEdit(2)}
            className="text-xs text-black/50 hover:text-black font-medium transition-colors"
          >
            Edit
          </button>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-black/60 bg-[var(--prism-canvas)] rounded-lg p-4 text-center">
            No life events added yet
          </p>
        ) : (
          <div className="space-y-2">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.05 }}
                className="flex items-center justify-between bg-[var(--prism-canvas)] rounded-lg p-3 text-sm"
              >
                <span className="text-black font-medium">{event.eventType}</span>
                <span className="text-black/50">{event.eventDate}</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-6 flex gap-4"
      >
        <button
          onClick={() => onEdit(1)}
          className="px-6 py-3 border border-black/10 text-black rounded-xl font-medium hover:bg-black/5 transition-colors"
        >
          Edit Details
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 px-8 py-3 bg-black text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Analysis'}
        </button>
      </motion.div>
    </>
  );
}
