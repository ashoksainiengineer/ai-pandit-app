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

function traitLabel(val: string | undefined | null): string {
  if (!val) return '—';
  return val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
  const fs = traits?.facialStructure ?? {};
  const sh = traits?.skinHair ?? {};
  const ht = traits?.height;

  return (
    <div className="space-y-6">
      <div className="bg-[#F5F0E8] rounded-xl p-6 border border-[#E8E0D5]">
        <h2 className="text-xl font-semibold text-[#2A2A2A] mb-4">Review Your Information</h2>
        <p className="text-[#7A756F]">Please review your birth details, life events, and physical traits before submitting.</p>
      </div>
      
      {/* Birth Details */}
      <div className="bg-white rounded-xl p-6 border border-[#E8E0D5]">
        <h3 className="text-lg font-semibold text-[#2A2A2A] mb-3">Birth Details</h3>
        <div className="text-sm text-[#7A756F] space-y-1">
          <p><strong>Name:</strong> {data.fullName || '—'}</p>
          <p><strong>Date:</strong> {data.dateOfBirth || '—'}</p>
          <p><strong>Time:</strong> {data.tentativeTime || '—'}</p>
          <p><strong>Place:</strong> {data.birthPlace || '—'}</p>
          <p><strong>Gender:</strong> {data.gender || '—'}</p>
        </div>
      </div>

      {/* Life Events */}
      <div className="bg-white rounded-xl p-6 border border-[#E8E0D5]">
        <h3 className="text-lg font-semibold text-[#2A2A2A] mb-3">Life Events ({events.length})</h3>
        {events.length === 0 ? (
          <p className="text-sm text-[#7A756F]">No life events added yet.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="text-sm text-[#7A756F]">
                <strong>{event.eventType}</strong> — {event.eventDate}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Physical Traits */}
      <div className="bg-white rounded-xl p-6 border border-[#E8E0D5]">
        <h3 className="text-lg font-semibold text-[#2A2A2A] mb-3">Physical Traits</h3>
        {traits ? (
          <div className="grid grid-cols-2 gap-3 text-sm text-[#3A3530]">
            <div><strong className="text-[#7A756F] text-xs">Eyes:</strong> <span className="capitalize">{traitLabel('eyeShape' in fs ? fs.eyeShape : undefined)}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Nose:</strong> <span className="capitalize">{traitLabel('noseShape' in fs ? (fs as Record<string,string>).noseShape : undefined)}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Forehead:</strong> <span className="capitalize">{traitLabel(fs.forehead)}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Jawline:</strong> <span className="capitalize">{traitLabel('jawLine' in fs ? (fs as Record<string,string>).jawLine : undefined)}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Lips:</strong> <span className="capitalize">{traitLabel('lips' in fs ? (fs as Record<string,string>).lips : undefined)}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Ears:</strong> <span className="capitalize">{traitLabel('ears' in fs ? (fs as Record<string,string>).ears : undefined)}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Voice:</strong> <span className="capitalize">{traitLabel('voicePitch' in fs ? (fs as Record<string,string>).voicePitch : undefined)}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Skin:</strong> <span className="capitalize">{traitLabel(sh.complexion)}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Hair:</strong> <span className="capitalize">{traitLabel(sh.hairType)}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Build:</strong> <span className="capitalize">{traitLabel(traits.build)}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Height:</strong> {ht && typeof ht === 'object' && (ht as {cm:number}).cm ? `${(ht as {cm:number}).cm} cm` : '—'}</div>
            {sh.marks && sh.marks.length > 0 && (
              <div className="col-span-2"><strong className="text-[#7A756F] text-xs">Special Marks:</strong> {sh.marks.join(', ')}</div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#7A756F]">No physical traits recorded.</p>
        )}
      </div>

      {/* Forensic Profile */}
      <div className="bg-white rounded-xl p-6 border border-[#E8E0D5]">
        <h3 className="text-lg font-semibold text-[#2A2A2A] mb-3">Forensic Profile</h3>
        {forensicTraits ? (
          <div className="grid grid-cols-2 gap-3 text-sm text-[#3A3530]">
            <div><strong className="text-[#7A756F] text-xs">Prakriti:</strong> <span className="capitalize">{forensicTraits.biological?.prakriti || '—'}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Temperament:</strong> <span className="capitalize">{forensicTraits.psychographic?.temperament || '—'}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Speech Style:</strong> <span className="capitalize">{forensicTraits.psychographic?.speechStyle || '—'}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Decision Making:</strong> <span className="capitalize">{forensicTraits.psychographic?.decisionMaking || '—'}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Stress Response:</strong> <span className="capitalize">{forensicTraits.psychographic?.stressResponse || '—'}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Sibling Position:</strong> <span className="capitalize">{forensicTraits.family?.siblingPosition || '—'}</span></div>
            <div><strong className="text-[#7A756F] text-xs">Brothers:</strong> {forensicTraits.family?.brotherCount ?? '—'}</div>
            <div><strong className="text-[#7A756F] text-xs">Sisters:</strong> {forensicTraits.family?.sisterCount ?? '—'}</div>
          </div>
        ) : (
          <p className="text-sm text-[#7A756F]">No forensic traits recorded.</p>
        )}
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
