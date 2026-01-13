'use client';

import { motion } from 'framer-motion';
import type { BirthData, PhysicalDescription, LifeEvent } from '@/types';

interface ReviewStepProps {
  birthData: Partial<BirthData>;
  physicalDesc: Partial<PhysicalDescription>;
  lifeEvents: LifeEvent[];
  onEdit: (step: number) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

const EVENT_CATEGORIES: Record<string, string> = {
  education: '📚',
  career: '💼',
  marriage: '💍',
  children: '👶',
  family: '👨‍👩‍👧',
  health: '🏥',
  financial: '💰',
  travel: '✈️',
};

export default function ReviewStep({
  birthData,
  physicalDesc,
  lifeEvents,
  onEdit,
  onSubmit,
  isProcessing
}: ReviewStepProps) {
  return (
    <div className="space-y-8">
      {/* Step Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 pt-8"
      >
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-3xl font-bold text-[#F7F9FC] mb-2">Review & Analyze</h2>
        <p className="text-[#A8B3C5] text-lg">
          Review your information before we calculate your exact birth time.
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Birth Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#1A1F26] border border-[#2D3542] rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F7F9FC]">
              <span>👤</span> BIRTH DETAILS
            </h3>
            <button
              onClick={() => onEdit(1)}
              className="text-xs font-medium text-[#F5A623] hover:text-[#FFBB3D] transition-colors"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[#6B7A90] text-xs mb-0.5">Full Name</div>
              <div className="text-[#F7F9FC] font-medium">{birthData.fullName}</div>
            </div>
            <div>
              <div className="text-[#6B7A90] text-xs mb-0.5">Gender</div>
              <div className="text-[#F7F9FC] font-medium capitalize">{birthData.gender}</div>
            </div>
            <div>
              <div className="text-[#6B7A90] text-xs mb-0.5">Date of Birth</div>
              <div className="text-[#F7F9FC] font-medium">{birthData.dateOfBirth}</div>
            </div>
            <div>
              <div className="text-[#6B7A90] text-xs mb-0.5">Birth Time</div>
              <div className="text-[#F7F9FC] font-medium">{birthData.tentativeTime}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[#6B7A90] text-xs mb-0.5">Birth Place</div>
              <div className="text-[#F7F9FC] font-medium">{birthData.birthPlace}</div>
            </div>
          </div>
        </motion.div>

        {/* Physical Description Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A1F26] border border-[#2D3542] rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F7F9FC]">
              <span>🎭</span> PHYSICAL APPEARANCE
            </h3>
            <button
              onClick={() => onEdit(2)}
              className="text-xs font-medium text-[#F5A623] hover:text-[#FFBB3D] transition-colors"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[#6B7A90] text-xs mb-0.5">Build</div>
              <div className="text-[#F7F9FC] font-medium capitalize">{physicalDesc.bodyStructure}</div>
            </div>
            <div>
              <div className="text-[#6B7A90] text-xs mb-0.5">Height</div>
              <div className="text-[#F7F9FC] font-medium capitalize">{physicalDesc.height}</div>
            </div>
            <div>
              <div className="text-[#6B7A90] text-xs mb-0.5">Face Shape</div>
              <div className="text-[#F7F9FC] font-medium capitalize">{physicalDesc.faceShape}</div>
            </div>
            <div>
              <div className="text-[#6B7A90] text-xs mb-0.5">Complexion</div>
              <div className="text-[#F7F9FC] font-medium capitalize">{physicalDesc.complexion}</div>
            </div>
            {physicalDesc.distinctiveFeatures && (
              <div className="col-span-2">
                <div className="text-[#6B7A90] text-xs mb-0.5">Distinctive Features</div>
                <div className="text-[#F7F9FC] font-medium">{physicalDesc.distinctiveFeatures}</div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Life Events Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#1A1F26] border border-[#2D3542] rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F7F9FC]">
              <span>📌</span> LIFE EVENTS ({lifeEvents.length})
            </h3>
            <button
              onClick={() => onEdit(3)}
              className="text-xs font-medium text-[#F5A623] hover:text-[#FFBB3D] transition-colors"
            >
              Edit
            </button>
          </div>
          <div className="space-y-2">
            {lifeEvents.map((event) => (
              <div key={event.id} className="text-sm">
                <div className="flex items-center gap-2">
                  <span>{EVENT_CATEGORIES[event.category]}</span>
                  <span className="text-[#F7F9FC] font-medium">{event.eventType}</span>
                  <span className="text-[#6B7A90]">-</span>
                  <span className="text-[#6B7A90]">{event.eventDate}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Analysis Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-xl p-6"
        >
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F5A623] mb-3">
            <span>⏱️</span> ANALYSIS INFO
          </h3>
          <ul className="space-y-2 text-sm text-[#A8B3C5]">
            <li>• Processing time: 20-30 seconds</li>
            <li>• Methods used: Event correlation + Dasha analysis</li>
            <li>• Expected accuracy: {lifeEvents.length >= 5 ? '90-95%' : lifeEvents.length >= 3 ? '80-85%' : '70-75%'} (based on {lifeEvents.length} events)</li>
          </ul>
          {lifeEvents.length < 5 && (
            <div className="mt-3 p-3 bg-[#242B35] border border-[#3D4654] rounded-lg">
              <p className="text-xs text-[#A8B3C5]">
                💡 Add {5 - lifeEvents.length} more event(s) for higher accuracy
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="pt-4"
      >
        <button
          onClick={onSubmit}
          disabled={isProcessing || lifeEvents.length < 3}
          className="w-full py-4 rounded-lg bg-gradient-to-r from-[#F5A623] to-[#E09000] text-[#0F1419] hover:shadow-lg hover:shadow-[#F5A623]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-[#0F1419]/30 border-t-[#0F1419] rounded-full animate-spin" />
              Analyzing Your Data...
            </>
          ) : (
            <>
              🔮 Calculate My Birth Time
            </>
          )}
        </button>

        {lifeEvents.length < 3 && (
          <p className="text-xs text-[#6B7A90] text-center mt-3">
            ℹ️ Minimum 3 events required to calculate
          </p>
        )}
      </motion.div>
    </div>
  );
}
