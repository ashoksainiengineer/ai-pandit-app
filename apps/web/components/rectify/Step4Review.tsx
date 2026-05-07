'use client';

import React from 'react';
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
    <div className="space-y-6">
      <div className="bg-[var(--prism-canvas)] rounded-xl p-6 border border-black/5">
        <h2 className="text-xl font-medium text-black mb-4">Review Your Information</h2>
        <p className="text-black/60">Please review your birth details and life events before submitting.</p>
      </div>
      
      {/* Birth Details */}
      <div className="bg-white rounded-xl p-6 border border-black/5">
        <h3 className="text-lg font-medium text-black mb-3">Birth Details</h3>
        <div className="text-sm text-black/60 space-y-1">
          <p><strong>Name:</strong> {data.fullName || '—'}</p>
          <p><strong>Date:</strong> {data.dateOfBirth || '—'}</p>
          <p><strong>Time:</strong> {data.tentativeTime || '—'}</p>
          <p><strong>Place:</strong> {data.birthPlace || '—'}</p>
          <p><strong>Gender:</strong> {data.gender || '—'}</p>
        </div>
      </div>

      {/* Life Events */}
      <div className="bg-white rounded-xl p-6 border border-black/5">
        <h3 className="text-lg font-medium text-black mb-3">Life Events ({events.length})</h3>
        {events.length === 0 ? (
          <p className="text-sm text-black/60">No life events added yet.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="text-sm text-black/60">
                <strong>{event.eventType}</strong> — {event.eventDate}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => onEdit(1)}
          className="px-6 py-3 border border-black/10 text-black rounded-xl font-medium hover:bg-black/5 transition-colors"
        >
          Edit Details
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-8 py-3 bg-black text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Analysis'}
        </button>
      </div>
    </div>
  );
}
