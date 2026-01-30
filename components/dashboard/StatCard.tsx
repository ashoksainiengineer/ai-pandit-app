/**
 * StatCard Component
 * Sacred Ivory Light Theme - Displays a single metric with trend indicator and icon
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
    bg: 'from-[#B8860B]/20 to-[#B8860B]/5',
    border: 'border-[#B8860B]/30',
    iconBg: 'bg-[#B8860B]/20',
    text: 'text-[#B8860B]',
    glow: 'shadow-[#B8860B]/10',
  },
  purple: {
    bg: 'from-[#6B1F7A]/20 to-[#6B1F7A]/5',
    border: 'border-[#6B1F7A]/30',
    iconBg: 'bg-[#6B1F7A]/20',
    text: 'text-[#8B4A9C]',
    glow: 'shadow-[#6B1F7A]/10',
  },
  green: {
    bg: 'from-[#2D7A5C]/20 to-[#2D7A5C]/5',
    border: 'border-[#2D7A5C]/30',
    iconBg: 'bg-[#2D7A5C]/20',
    text: 'text-[#2D7A5C]',
    glow: 'shadow-[#2D7A5C]/10',
  },
  blue: {
    bg: 'from-[#6B9AC4]/20 to-[#6B9AC4]/5',
    border: 'border-[#6B9AC4]/30',
    iconBg: 'bg-[#6B9AC4]/20',
    text: 'text-[#6B9AC4]',
    glow: 'shadow-[#6B9AC4]/10',
  },
  red: {
    bg: 'from-[#C65D3B]/20 to-[#C65D3B]/5',
    border: 'border-[#C65D3B]/30',
    iconBg: 'bg-[#C65D3B]/20',
    text: 'text-[#C65D3B]',
    glow: 'shadow-[#C65D3B]/10',
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
      <div className={`bg-white border ${colors.border} rounded-2xl p-6 animate-pulse`}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 w-full">
            <div className="h-4 bg-[#F5EFE7] rounded w-24" />
            <div className="h-8 bg-[#F5EFE7] rounded w-16" />
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
    ? 'text-[#2D7A5C]' 
    : trend && trend.value < 0 
      ? 'text-[#C65D3B]' 
      : 'text-[#A8A39D]';

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
            <p className="text-sm font-medium text-[#7A756F] uppercase tracking-wider">
              {title}
            </p>
            <h3 className={`text-3xl font-bold ${colors.text} mt-1`}>
              {value}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#A8A39D] mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`
            w-14 h-14 rounded-2xl ${colors.iconBg}
            flex items-center justify-center
            border border-white
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
            <span className="text-xs text-[#7A756F]">{trend.label}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
