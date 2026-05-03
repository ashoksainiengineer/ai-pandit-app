/**
 * ChartCard Component
 * Wrapper for charts with title, subtitle, and loading state
 */

'use client';

import { motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import type { ChartCardProps } from '@/app/types/dashboard';

export default function ChartCard({
  title,
  subtitle,
  children,
  className = '',
  loading = false,
}: ChartCardProps) {
  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-[#F0E8DE] p-6 ${className}`}>
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <div className="w-32 h-6 rounded bg-[#FDF8F3] animate-pulse" />
            <div className="w-48 h-4 rounded bg-[#FDF8F3] animate-pulse" />
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#FDF8F3] animate-pulse" />
        </div>
        <div className="h-64 rounded-xl bg-[#FDF8F3] animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl border border-[#F0E8DE] p-6 ${className}`}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[#1A1612] font-[family-name:var(--font-cormorant)]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-[#7A756F] mt-1">{subtitle}</p>
          )}
        </div>
        <button className="p-2 rounded-lg hover:bg-[#FDF8F3] text-[#7A756F] hover:text-[#1A1612] transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      {children}
    </motion.div>
  );
}
