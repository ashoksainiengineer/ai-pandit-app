/**
 * StatCard Component
 * Displays a single metric with trend indicator and icon
 */

'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color: 'gold' | 'purple' | 'green' | 'blue' | 'red';
  isLoading?: boolean;
  onClick?: () => void;
}

const colorVariants = {
  gold: {
    bg: 'from-[#D4AF37]/20 to-[#D4AF37]/5',
    border: 'border-[#D4AF37]/30',
    iconBg: 'bg-[#D4AF37]/20',
    text: 'text-[#D4AF37]',
    glow: 'shadow-[#D4AF37]/10',
  },
  purple: {
    bg: 'from-[#6A0572]/20 to-[#6A0572]/5',
    border: 'border-[#6A0572]/30',
    iconBg: 'bg-[#6A0572]/20',
    text: 'text-[#9D4EDD]',
    glow: 'shadow-[#6A0572]/10',
  },
  green: {
    bg: 'from-[#2D7A5C]/20 to-[#2D7A5C]/5',
    border: 'border-[#2D7A5C]/30',
    iconBg: 'bg-[#2D7A5C]/20',
    text: 'text-[#2D7A5C]',
    glow: 'shadow-[#2D7A5C]/10',
  },
  blue: {
    bg: 'from-[#3B82F6]/20 to-[#3B82F6]/5',
    border: 'border-[#3B82F6]/30',
    iconBg: 'bg-[#3B82F6]/20',
    text: 'text-[#3B82F6]',
    glow: 'shadow-[#3B82F6]/10',
  },
  red: {
    bg: 'from-[#EF4444]/20 to-[#EF4444]/5',
    border: 'border-[#EF4444]/30',
    iconBg: 'bg-[#EF4444]/20',
    text: 'text-[#EF4444]',
    glow: 'shadow-[#EF4444]/10',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
  isLoading,
  onClick,
}: StatCardProps) {
  const colors = colorVariants[color];

  if (isLoading) {
    return (
      <div className={`glass-card p-6 border ${colors.border} animate-pulse`}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 w-full">
            <div className="h-4 bg-white/10 rounded w-24" />
            <div className="h-8 bg-white/10 rounded w-16" />
          </div>
          <div className={`w-12 h-12 ${colors.iconBg} rounded-xl`} />
        </div>
      </div>
    );
  }

  const TrendIcon = trend && trend.value > 0 
    ? TrendingUp 
    : trend && trend.value < 0 
      ? TrendingDown 
      : Minus;
  
  const trendColor = trend && trend.value > 0 
    ? 'text-green-400' 
    : trend && trend.value < 0 
      ? 'text-red-400' 
      : 'text-gray-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl border ${colors.border}
        bg-gradient-to-br ${colors.bg}
        backdrop-blur-xl
        transition-all duration-300
        hover:shadow-lg hover:${colors.glow}
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Background glow effect */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${colors.bg} rounded-full blur-3xl opacity-50`} />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-[#8C7F72] uppercase tracking-wider">
              {title}
            </p>
            <h3 className={`text-3xl font-bold ${colors.text} mt-1`}>
              {value}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#C4B8AD] mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`
            w-14 h-14 rounded-2xl ${colors.iconBg}
            flex items-center justify-center
            border border-white/10
          `}>
            {icon}
          </div>
        </div>

        {trend && (
          <div className="flex items-center gap-2 mt-2">
            <TrendIcon className={`w-4 h-4 ${trendColor}`} />
            <span className={`text-sm font-medium ${trendColor}`}>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-[#8C7F72]">{trend.label}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
