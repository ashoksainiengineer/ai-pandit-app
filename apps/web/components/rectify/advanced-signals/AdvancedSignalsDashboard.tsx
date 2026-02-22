
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SectionErrorBoundary } from '@/components/rectify/AnalysisErrorBoundary';
import { Gem } from 'lucide-react';

// 1. Import the real components and types
import AshtakavargaChart from './signal-cards/AshtakavargaChart';
import ParivartanaYogaCard from './signal-cards/ParivartanaYogaCard';
import YoginiDashaTimeline from './signal-cards/YoginiDashaTimeline';
import { IAdvancedSignals } from './types';

// Main Dashboard Component
// ============================================================================

interface AdvancedSignalsDashboardProps {
  signals: IAdvancedSignals | null;
  isComplete: boolean;
}

const AdvancedSignalsDashboard: React.FC<AdvancedSignalsDashboardProps> = ({
  signals,
  isComplete,
}) => {
  const hasSignals = signals && Object.values(signals).some(value => value !== undefined && (!Array.isArray(value) || value.length > 0));

  if (!hasSignals) {
    return isComplete ? null : <LoadingSkeleton />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Orchestrate the staggered animation of each SignalCard
      },
    },
  };

  return (
    <SectionErrorBoundary sectionName="Advanced Signals" icon={<Gem className="w-5 h-5" />}>
      <div className="mb-fib-4">
        <h2 className="text-h4 font-display text-accent-gold-muted">
          Astrological Deep Analysis
        </h2>
        <p className="text-phi-sm text-text-muted">These signals provide objective, astrological proof for the birth time analysis.</p>
      </div>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-fib-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 2. Implement the Strategy Pattern: Render cards only if data exists */}

        {signals.ashtakavargaScores && (
          <AshtakavargaChart scores={signals.ashtakavargaScores} />
        )}

        {signals.parivartanaYogas && signals.parivartanaYogas.length > 0 && (
          <ParivartanaYogaCard yogas={signals.parivartanaYogas} />
        )}

        {signals.yoginiDasha && (
          <YoginiDashaTimeline dashaPeriods={signals.yoginiDasha} />
        )}

      </motion.div>
    </SectionErrorBoundary>
  );
};


// Loading Skeleton Component
// ============================================================================

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="p-fib-4 bg-bg-surface rounded-lg border border-border-default">
      <div className="flex items-center gap-fib-4">
        <Gem className="w-6 h-6 text-accent-gold-muted animate-pulse-slow" />
        <div>
          <h3 className="text-h6 font-bold text-text-muted">Analyzing Advanced Signals...</h3>
          <p className="text-phi-sm text-text-disabled">Extracting deep astrological patterns from the planetary data.</p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSignalsDashboard;

