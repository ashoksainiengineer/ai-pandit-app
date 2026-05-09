'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BirthData, LifeEvent, SpouseData, TimeOffsetConfig } from '@/lib/types';

interface Step4ReviewProps {
  data: BirthData;
  events: LifeEvent[];
  spouseData?: SpouseData;
  onSubmit: () => void;
  isSubmitting: boolean;
  onEdit: (step: number) => void;
  offsetConfig?: TimeOffsetConfig;
}

const importanceBadge = (importance: string) => {
  const styles: Record<string, string> = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    low: 'bg-gray-50 text-gray-600 border-gray-200',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${styles[importance] || styles.low}`}>
      {importance}
    </span>
  );
};

const datePrecisionLabel = (precision?: string) => {
  const labels: Record<string, string> = {
    exact_date_time: 'Exact Date & Time',
    exact_date: 'Exact Date',
    date_range: 'Date Range',
    month_year: 'Month & Year',
    month_range: 'Month Range',
    year_range: 'Year',
  };
  return precision ? (labels[precision] || precision) : 'Exact Date';
};

const formatCoordinate = (val: number | undefined | null, decimals = 4): string => {
  if (val == null || isNaN(val)) return '—';
  return val.toFixed(decimals);
};

export default function Step4Review({
  data,
  events,
  spouseData,
  onSubmit,
  isSubmitting,
  onEdit,
  offsetConfig,
}: Step4ReviewProps) {
  const hasSpouseData =
    spouseData?.name || spouseData?.dateOfBirth || spouseData?.birthTime || spouseData?.birthPlace;

  const totalEvents = events.length;
  const criticalEvents = events.filter(e => e.importance === 'critical' || e.importance === 'high').length;
  const categoriesCovered = new Set(events.map(e => e.category)).size;

  return (
    <>
      {/* Header */}
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
          Please verify all details before submitting for analysis
        </motion.p>
      </div>

      {/* Security Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex items-center justify-center gap-2 text-xs text-[#184131] bg-[#184131]/5 py-2 px-4 rounded-full border border-[#184131]/10 mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="font-medium">End-to-End Encrypted</span>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
      >
        <div className="bg-[var(--prism-canvas)] rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-black">{totalEvents}</p>
          <p className="text-[10px] text-black/40 uppercase tracking-wider mt-1">Life Events</p>
        </div>
        <div className="bg-[var(--prism-canvas)] rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-black">{categoriesCovered}</p>
          <p className="text-[10px] text-black/40 uppercase tracking-wider mt-1">Categories</p>
        </div>
        <div className="bg-[var(--prism-canvas)] rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-black">{criticalEvents}</p>
          <p className="text-[10px] text-black/40 uppercase tracking-wider mt-1">High Impact</p>
        </div>
        <div className="bg-[var(--prism-canvas)] rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-black">{hasSpouseData ? 'Yes' : '—'}</p>
          <p className="text-[10px] text-black/40 uppercase tracking-wider mt-1">Spouse Data</p>
        </div>
      </motion.div>

      {/* Birth Details Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden mb-4"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          <h3 className="text-lg font-medium text-black">Birth Details</h3>
          <button
            onClick={() => onEdit(1)}
            className="text-xs text-black/50 hover:text-black font-medium transition-colors"
          >
            Edit
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <TableRow label="Full Name" value={data.fullName || '—'} />
              <TableRow label="Date of Birth" value={data.dateOfBirth || '—'} />
              <TableRow label="Approximate Birth Time" value={data.tentativeTime || '—'} />
              <TableRow label="Gender" value={data.gender ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1) : '—'} />
              <TableRow label="Birth Place" value={data.birthPlace || '—'} />
              <TableRow label="Latitude" value={formatCoordinate(data.latitude) + '°'} />
              <TableRow label="Longitude" value={formatCoordinate(data.longitude) + '°'} />
              <TableRow label="Timezone" value={data.timezone != null ? `UTC${data.timezone >= 0 ? '+' : ''}${data.timezone}` : '—'} />
              {offsetConfig && (
                <TableRow
                  label="Time Uncertainty Window"
                  value={
                    offsetConfig.preset === 'custom'
                      ? `±${offsetConfig.customMinutes || '?'} minutes`
                      : offsetConfig.description || offsetConfig.preset || '—'
                  }
                />
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Spouse Details Table */}
      {hasSpouseData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden mb-4"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
            <h3 className="text-lg font-medium text-black">Spouse Details</h3>
            <button
              onClick={() => onEdit(1)}
              className="text-xs text-black/50 hover:text-black font-medium transition-colors"
            >
              Edit
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {spouseData.name && <TableRow label="Spouse Name" value={spouseData.name} />}
                {spouseData.dateOfBirth && <TableRow label="Date of Birth" value={spouseData.dateOfBirth} />}
                {spouseData.birthTime && <TableRow label="Birth Time" value={spouseData.birthTime} />}
                {spouseData.birthPlace && <TableRow label="Birth Place" value={spouseData.birthPlace} />}
                {spouseData.latitude != null && <TableRow label="Latitude" value={formatCoordinate(spouseData.latitude) + '°'} />}
                {spouseData.longitude != null && <TableRow label="Longitude" value={formatCoordinate(spouseData.longitude) + '°'} />}
                {spouseData.timezone != null && (
                  <TableRow
                    label="Timezone"
                    value={`UTC${Number(spouseData.timezone) >= 0 ? '+' : ''}${spouseData.timezone}`}
                  />
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Life Events Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: hasSpouseData ? 0.55 : 0.5 }}
        className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden mb-4"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
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
          <div className="p-6">
            <p className="text-sm text-black/60 bg-[var(--prism-canvas)] rounded-lg p-4 text-center">
              No life events added yet. At least 3 events are required for accurate analysis.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--prism-canvas)] text-left">
                  <th className="px-6 py-3 text-[10px] font-medium text-black/40 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-[10px] font-medium text-black/40 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-[10px] font-medium text-black/40 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-[10px] font-medium text-black/40 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-[10px] font-medium text-black/40 uppercase tracking-wider">Precision</th>
                  <th className="px-6 py-3 text-[10px] font-medium text-black/40 uppercase tracking-wider">Importance</th>
                  <th className="px-6 py-3 text-[10px] font-medium text-black/40 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, i) => (
                  <tr key={event.id} className="border-t border-black/[0.04] hover:bg-[var(--prism-canvas)]/50 transition-colors">
                    <td className="px-6 py-3 text-xs text-black/40">{i + 1}</td>
                    <td className="px-6 py-3">
                      <span className="text-black font-medium">
                        {event.icon ? `${event.icon} ` : ''}{event.eventType}
                      </span>
                      {event.isCustom && (
                        <span className="ml-2 text-[10px] text-black/30 italic">custom</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--prism-canvas)] text-black/60 capitalize">
                        {event.category}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-black/80">{event.eventDate}</div>
                      {event.eventTime && (
                        <div className="text-[10px] text-black/40 mt-0.5">{event.eventTime}</div>
                      )}
                      {event.endDate && (
                        <div className="text-[10px] text-black/40">
                          to {event.endDate}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-black/50">{datePrecisionLabel(event.datePrecision)}</span>
                    </td>
                    <td className="px-6 py-3">{importanceBadge(event.importance)}</td>
                    <td className="px-6 py-3 max-w-[200px]">
                      <p className="text-xs text-black/60 line-clamp-2">
                        {event.description || '—'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-4 mt-6"
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

/** Reusable table row for key-value display */
function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-t border-black/[0.04]">
      <td className="px-6 py-3 text-xs text-black/40 font-medium w-48">{label}</td>
      <td className="px-6 py-3 text-sm text-black">{value}</td>
    </tr>
  );
}
