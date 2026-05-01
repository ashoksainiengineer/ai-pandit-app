'use client';

import React from 'react';
import { BirthData, LifeEvent, PhysicalTraits, ForensicTraits } from '@/lib/types';

interface Step4ReviewProps {
  data: BirthData;
  events: LifeEvent[];
  traits: PhysicalTraits;
  forensicTraits: ForensicTraits;
  onSubmit: () => void;
  isSubmitting: boolean;
  onEdit: (step: number) => void;
  offsetConfig?: unknown;
}

export default function Step4Review({
  data,
  events,
  traits,
  forensicTraits,
  onSubmit,
  isSubmitting,
  onEdit,
  offsetConfig,
}: Step4ReviewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-[#F5F0E8] rounded-xl p-6 border border-[#E8E0D5]">
        <h2 className="text-xl font-semibold text-[#2A2A2A] mb-4">Review Your Information</h2>
        <p className="text-[#7A756F]">Please review your birth details, life events, and physical traits before submitting.</p>
      </div>
      
      <div className="bg-white rounded-xl p-6 border border-[#E8E0D5]">
        <h3 className="text-lg font-semibold text-[#2A2A2A] mb-3">Birth Details</h3>
        <div className="text-sm text-[#7A756F]">
          <p><strong>Name:</strong> {data.fullName}</p>
          <p><strong>Date:</strong> {data.dateOfBirth}</p>
          <p><strong>Time:</strong> {data.tentativeTime}</p>
          <p><strong>Place:</strong> {data.birthPlace}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[#E8E0D5]">
        <h3 className="text-lg font-semibold text-[#2A2A2A] mb-3">Life Events ({events.length})</h3>
        {events.length === 0 ? (
          <p className="text-sm text-[#7A756F]">No life events added yet.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="text-sm text-[#7A756F]">
                {event.eventType} — {event.eventDate}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 border border-[#E8E0D5]">
        <h3 className="text-lg font-semibold text-[#2A2A2A] mb-3">Physical Traits</h3>
        <p className="text-sm text-[#7A756F]">Traits captured for forensic analysis.</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => onEdit(1)}
          className="px-6 py-3 border-2 border-[#B8860B]/50 text-[#B8860B] rounded-xl font-semibold hover:bg-[#B8860B]/10 transition-colors"
        >
          Edit Details
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-8 py-3 bg-gradient-to-r from-[#B8860B] to-[#78611D] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Analysis'}
        </button>
      </div>
    </div>
  );
}
