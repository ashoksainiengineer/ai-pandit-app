/**
 * InsightsPanel Component
 * Displays AI-generated insights and recommendations
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Trophy, 
  X,
  ArrowRight 
} from 'lucide-react';
import Link from 'next/link';
import { InsightItem } from '@/lib/dashboard/types';

interface InsightsPanelProps {
  insights: InsightItem[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

const typeConfig = {
  trend: {
    icon: TrendingUp,
    color: 'text-[#3B82F6]',
    bgColor: 'bg-[#3B82F6]/10',
    borderColor: 'border-[#3B82F6]/30',
  },
  pattern: {
    icon: AlertTriangle,
    color: 'text-[#F59E0B]',
    bgColor: 'bg-[#F59E0B]/10',
    borderColor: 'border-[#F59E0B]/30',
  },
  suggestion: {
    icon: Lightbulb,
    color: 'text-[#10B981]',
    bgColor: 'bg-[#10B981]/10',
    borderColor: 'border-[#10B981]/30',
  },
  achievement: {
    icon: Trophy,
    color: 'text-[#D4AF37]',
    bgColor: 'bg-[#D4AF37]/10',
    borderColor: 'border-[#D4AF37]/30',
  },
};

const priorityConfig = {
  high: 'shadow-lg shadow-red-500/10 border-red-500/30',
  medium: 'shadow-md border-white/10',
  low: 'opacity-80',
};

export function InsightsPanel({ insights, onDismiss, onDismissAll }: InsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="text-4xl mb-3">✨</div>
        <h3 className="text-lg font-semibold text-[#F5F0EB]">All caught up!</h3>
        <p className="text-sm text-[#8C7F72]">
          No new insights at the moment. Check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#F5F0EB]">Insights</h3>
          <p className="text-sm text-[#8C7F72]">
            {insights.length} insight{insights.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <button
          onClick={onDismissAll}
          className="text-xs text-[#8C7F72] hover:text-[#C4B8AD] transition-colors"
        >
          Dismiss All
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {insights.map((insight) => {
            const config = typeConfig[insight.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={insight.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`
                  relative p-4 rounded-xl border
                  ${config.borderColor}
                  ${config.bgColor}
                  ${priorityConfig[insight.priority]}
                  transition-all duration-200
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-10 h-10 rounded-xl
                    flex items-center justify-center
                    ${config.bgColor}
                  `}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold ${config.color}`}>
                      {insight.title}
                    </h4>
                    <p className="text-sm text-[#C4B8AD] mt-1">
                      {insight.description}
                    </p>

                    {insight.actionable && insight.actionHref && (
                      <Link
                        href={insight.actionHref}
                        className={`
                          inline-flex items-center gap-1 mt-2
                          text-sm font-medium ${config.color}
                          hover:underline
                        `}
                      >
                        {insight.actionLabel}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>

                  <button
                    onClick={() => onDismiss(insight.id)}
                    className="p-1 rounded-lg text-[#8C7F72] hover:text-[#C4B8AD] hover:bg-white/5 transition-colors"
                    aria-label="Dismiss insight"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
