'use client';

import { motion } from 'framer-motion';

interface HeaderProps {
  currentStep: number;
  totalSteps: number;
}

export default function Header({ currentStep, totalSteps }: HeaderProps) {
  const progress = (currentStep / totalSteps) * 100;

  const stepLabels = [
    'Birth Details',
    'Physical Appearance',
    'Life Events',
    'Review'
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1A1F26] border-b border-[#2D3542] backdrop-blur-sm">
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Logo and Step */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔆</div>
            <div>
              <div className="font-semibold text-[#F7F9FC]">AI-Pandit</div>
              <div className="text-xs text-[#6B7A90]">Birth Rectification</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-medium text-[#F7F9FC]">
              Step {currentStep} of {totalSteps}
            </div>
            <div className="text-xs text-[#6B7A90]">
              {stepLabels[currentStep - 1]}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#2D3542] h-1.5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#F5A623] to-[#E09000]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>

        {/* Progress Text */}
        <div className="text-xs text-[#6B7A90] mt-2 text-right">
          {Math.round(progress)}% complete
        </div>
      </div>
    </header>
  );
}
