'use client';

import { motion } from 'framer-motion';
import type { PhysicalDescription } from '@/types';

interface PhysicalStepProps {
  physicalDesc: Partial<PhysicalDescription>;
  setPhysicalDesc: (data: Partial<PhysicalDescription>) => void;
}

export default function PhysicalStep({ physicalDesc, setPhysicalDesc }: PhysicalStepProps) {
  const cardButtonClass = (isSelected: boolean) =>
    `p-4 rounded-xl border-2 transition-all text-center ${
      isSelected
        ? 'border-[#F5A623] bg-[#F5A623]/10'
        : 'border-[#3D4654] bg-[#242B35] hover:border-[#2D3542]'
    }`;

  return (
    <div className="space-y-8">
      {/* Step Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 pt-8"
      >
        <div className="text-5xl mb-4">👤</div>
        <h2 className="text-3xl font-bold text-[#F7F9FC] mb-2">Physical Appearance</h2>
        <p className="text-[#A8B3C5] text-lg">
          Your physical traits help verify the correct Ascendant.<br />
          Answer honestly - there's no right or wrong.
        </p>
      </motion.div>

      {/* Explanation Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-xl p-6"
      >
        <h3 className="font-semibold text-[#F5A623] mb-3 flex items-center gap-2">
          <span>🔬</span> WHY WE ASK THIS
        </h3>
        <p className="text-sm text-[#A8B3C5] leading-relaxed">
          In Vedic astrology, your Ascendant (rising sign) influences physical appearance: Leo rising → broad shoulders, Virgo rising → slim build, Taurus rising → sturdy build. This helps us verify if the calculated time is correct.
        </p>
      </motion.div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1A1F26] border border-[#2D3542] rounded-2xl p-8 space-y-8"
      >
        {/* Body Structure */}
        <div>
          <label className="block text-sm font-semibold text-[#F7F9FC] mb-3">
            How would you describe your body type?
          </label>
          <div className="grid grid-cols-4 gap-3">
            {[
              { emoji: '🧍', label: 'Slim', value: 'slim' },
              { emoji: '🧍‍♂️', label: 'Average', value: 'average' },
              { emoji: '💪', label: 'Athletic', value: 'athletic' },
              { emoji: '🧍‍♂️', label: 'Heavy', value: 'heavy' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPhysicalDesc({ ...physicalDesc, bodyStructure: option.value as any })}
                className={cardButtonClass(physicalDesc.bodyStructure === option.value)}
              >
                <div className="text-3xl mb-2">{option.emoji}</div>
                <div className="text-sm font-medium text-[#F7F9FC]">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Height */}
        <div>
          <label className="block text-sm font-semibold text-[#F7F9FC] mb-3">
            Your height compared to average?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { emoji: '📏', label: 'Below Avg', desc: '< 5\'4" (163cm)', value: 'short' },
              { emoji: '📏', label: 'Average', desc: '5\'4"-5\'9"', value: 'average' },
              { emoji: '📏', label: 'Above Avg', desc: '> 5\'9" (175cm)', value: 'tall' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPhysicalDesc({ ...physicalDesc, height: option.value as any })}
                className={cardButtonClass(physicalDesc.height === option.value)}
              >
                <div className="text-3xl mb-2">{option.emoji}</div>
                <div className="text-sm font-medium text-[#F7F9FC]">{option.label}</div>
                <div className="text-xs text-[#6B7A90] mt-1">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Face Shape */}
        <div>
          <label className="block text-sm font-semibold text-[#F7F9FC] mb-3">
            Which face shape is closest to yours?
          </label>
          <div className="grid grid-cols-5 gap-3">
            {[
              { emoji: '⭕', label: 'Round', value: 'round' },
              { emoji: '⬭', label: 'Oval', value: 'oval' },
              { emoji: '▢', label: 'Square', value: 'square' },
              { emoji: '◇', label: 'Angular', value: 'angular' },
              { emoji: '♡', label: 'Heart', value: 'heart' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPhysicalDesc({ ...physicalDesc, faceShape: option.value as any })}
                className={cardButtonClass(physicalDesc.faceShape === option.value)}
              >
                <div className="text-3xl mb-2">{option.emoji}</div>
                <div className="text-xs font-medium text-[#F7F9FC]">{option.label}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-[#6B7A90] mt-2">💡 Look in mirror: Is your face wider or longer?</p>
        </div>

        {/* Complexion */}
        <div>
          <label className="block text-sm font-semibold text-[#F7F9FC] mb-3">
            Your natural complexion?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { color: 'bg-orange-200', label: 'Fair', value: 'fair' },
              { color: 'bg-yellow-700', label: 'Wheatish', value: 'wheatish' },
              { color: 'bg-yellow-900', label: 'Dark', value: 'dark' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPhysicalDesc({ ...physicalDesc, complexion: option.value as any })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  physicalDesc.complexion === option.value
                    ? 'border-[#F5A623] ring-2 ring-[#F5A623]/50'
                    : 'border-[#3D4654]'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg ${option.color} mx-auto mb-2`} />
                <div className="text-sm font-medium text-[#F7F9FC]">{option.label}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-[#6B7A90] mt-2">ℹ️ Compare with unexposed skin (inside of forearm)</p>
        </div>

        {/* Distinctive Features */}
        <div>
          <label className="block text-sm font-semibold text-[#F7F9FC] mb-2">
            Any distinctive features? <span className="text-[#6B7A90]">(Optional)</span>
          </label>
          <input
            type="text"
            value={physicalDesc.distinctiveFeatures || ''}
            onChange={(e) => setPhysicalDesc({ ...physicalDesc, distinctiveFeatures: e.target.value })}
            placeholder="E.g., birthmarks, scars, moles, prominent nose..."
            className="w-full h-12 px-4 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] placeholder-[#6B7A90] focus:border-[#F5A623] focus:outline-none"
          />
        </div>
      </motion.div>
    </div>
  );
}
