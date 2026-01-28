/**
 * SessionCard Component
 * Displays a single session with rich information and actions
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Star,
  MoreVertical,
  Copy,
  Trash2,
  ExternalLink,
  RefreshCw,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { DashboardSession } from '@/lib/dashboard/types';

interface SessionCardProps {
  session: DashboardSession;
  isSelected?: boolean;
  isFavorite?: boolean;
  viewMode: 'grid' | 'list' | 'compact';
  onSelect?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

const statusConfig = {
  complete: {
    label: '✓ GOD-TIER VERIFIED',
    bgColor: 'bg-[#2D7A5C]/20',
    textColor: 'text-[#2D7A5C]',
    borderColor: 'border-[#2D7A5C]/50',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  processing: {
    label: '⚡ ANALYZING MULTIVERSE',
    bgColor: 'bg-[#D4AF37]/20',
    textColor: 'text-[#D4AF37]',
    borderColor: 'border-[#D4AF37]/50',
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
  },
  pending: {
    label: '🕒 QUEUED',
    bgColor: 'bg-[#3B82F6]/20',
    textColor: 'text-[#3B82F6]',
    borderColor: 'border-[#3B82F6]/50',
    icon: <Clock className="w-4 h-4" />,
  },
  failed: {
    label: '✗ FAILED',
    bgColor: 'bg-[#EF4444]/20',
    textColor: 'text-[#EF4444]',
    borderColor: 'border-[#EF4444]/50',
    icon: <AlertCircle className="w-4 h-4" />,
  },
};

const confidenceConfig = {
  'god-tier': { color: '#D4AF37', label: 'GOD-TIER' },
  'high': { color: '#2D7A5C', label: 'HIGH' },
  'medium': { color: '#F59E0B', label: 'MEDIUM' },
  'low': { color: '#EF4444', label: 'LOW' },
};

export function SessionCard({
  session,
  isSelected,
  isFavorite,
  viewMode,
  onSelect,
  onFavorite,
  onDelete,
  onDuplicate,
}: SessionCardProps) {
  const [showActions, setShowActions] = useState(false);
  const status = statusConfig[session.status as keyof typeof statusConfig] || statusConfig.pending;
  const confidence = session.confidence ? confidenceConfig[session.confidence as keyof typeof confidenceConfig] : null;

  const formattedDate = new Date(session.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavorite?.(session.id);
  };

  if (viewMode === 'compact') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`
          flex items-center gap-3 p-3 rounded-lg border
          ${isSelected ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'bg-[#0F1419]/50 border-[#D4AF37]/10'}
          hover:border-[#D4AF37]/30 transition-all cursor-pointer
        `}
        onClick={() => onSelect?.(session.id)}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          className="w-4 h-4 rounded border-[#D4AF37]/30 bg-transparent text-[#D4AF37] focus:ring-[#D4AF37]"
        />
        <div className={`w-2 h-2 rounded-full ${status.bgColor.replace('/20', '')}`} />
        <span className="flex-1 truncate text-sm text-[#F5F0EB]">{session.fullName}</span>
        <span className="text-xs text-[#8C7F72]">{formattedDate}</span>
      </motion.div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className={`
          relative group rounded-2xl border p-5
          ${isSelected ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'bg-[#0F1419]/80 border-[#D4AF37]/10'}
          hover:border-[#D4AF37]/40 hover:shadow-lg hover:shadow-[#D4AF37]/5
          transition-all duration-300
        `}
      >
        {/* Selection Checkbox */}
        {onSelect && (
          <div className="absolute top-4 left-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(session.id)}
              className="w-5 h-5 rounded border-[#D4AF37]/30 bg-transparent text-[#D4AF37] focus:ring-[#D4AF37]"
            />
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className={`
            absolute top-4 right-4 p-2 rounded-xl
            transition-all duration-200
            ${isFavorite 
              ? 'text-[#D4AF37] bg-[#D4AF37]/20' 
              : 'text-[#8C7F72] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'
            }
          `}
        >
          <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Content */}
        <Link href={`/rectify/${session.id}${session.status === 'complete' ? '/results' : ''}`}>
          <div className="pt-8">
            {/* Status Badge */}
            <div className={`
              inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
              ${status.bgColor} ${status.textColor} border ${status.borderColor}
              ${session.status === 'processing' ? 'animate-pulse' : ''}
            `}>
              {status.icon}
              {status.label}
            </div>

            {/* Name */}
            <h3 className="mt-4 text-lg font-semibold text-[#F5F0EB] truncate">
              {session.fullName}
            </h3>

            {/* Details */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#8C7F72]">
                <Calendar className="w-4 h-4" />
                {session.dateOfBirth}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#8C7F72]">
                <MapPin className="w-4 h-4" />
                {session.birthPlace}
              </div>
            </div>

            {/* Rectified Time */}
            {session.rectifiedTime && (
              <div className="mt-4 p-3 bg-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/20">
                <span className="text-xs text-[#8C7F72] uppercase tracking-wider">Rectified Time</span>
                <p className="text-[#D4AF37] font-mono font-bold">{session.rectifiedTime}</p>
              </div>
            )}

            {/* Confidence & Accuracy */}
            {confidence && session.accuracy && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8C7F72]">Confidence:</span>
                  <span className="text-xs font-bold" style={{ color: confidence.color }}>
                    {confidence.label}
                  </span>
                </div>
                <div className="w-16 h-1.5 bg-[#151a21] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${session.accuracy}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: confidence.color }}
                  />
                </div>
              </div>
            )}

            {/* Date */}
            <div className="mt-4 pt-4 border-t border-[#D4AF37]/10 text-xs text-[#8C7F72]">
              Created {formattedDate}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // List View (Default)
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        group relative flex items-center gap-4 p-4 rounded-xl border
        ${isSelected ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'bg-[#0F1419]/50 border-[#D4AF37]/10'}
        hover:border-[#D4AF37]/30 transition-all
      `}
    >
      {/* Selection */}
      {onSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(session.id)}
          className="w-5 h-5 rounded border-[#D4AF37]/30 bg-transparent text-[#D4AF37] focus:ring-[#D4AF37]"
        />
      )}

      {/* Status Indicator */}
      <div className={`w-2 h-2 rounded-full ${status.bgColor.replace('/20', '')}`} />

      {/* Main Content */}
      <Link 
        href={`/rectify/${session.id}${session.status === 'complete' ? '/results' : ''}`}
        className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center"
      >
        {/* Name & Status */}
        <div className="col-span-3 min-w-0">
          <h3 className="font-semibold text-[#F5F0EB] truncate">{session.fullName}</h3>
          <span className={`
            inline-flex items-center gap-1 text-xs font-bold uppercase
            ${status.textColor}
          `}>
            {status.icon}
            {session.status}
          </span>
        </div>

        {/* Birth Info */}
        <div className="col-span-2 text-sm text-[#8C7F72]">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {session.dateOfBirth}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{session.birthPlace}</span>
          </div>
        </div>

        {/* Rectified Time */}
        <div className="col-span-2">
          {session.rectifiedTime ? (
            <div>
              <span className="text-[#D4AF37] font-mono font-bold">{session.rectifiedTime}</span>
              {confidence && (
                <span className="ml-2 text-xs" style={{ color: confidence.color }}>
                  {confidence.label}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-[#8C7F72]">—</span>
          )}
        </div>

        {/* Confidence Bar */}
        <div className="col-span-2">
          {session.accuracy ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#151a21] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#2D7A5C]"
                  style={{ width: `${session.accuracy}%` }}
                />
              </div>
              <span className="text-xs text-[#8C7F72]">{session.accuracy}%</span>
            </div>
          ) : (
            <span className="text-xs text-[#8C7F72]">No accuracy data</span>
          )}
        </div>

        {/* Date */}
        <div className="col-span-2 text-sm text-[#8C7F72] text-right">
          {formattedDate}
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleFavoriteClick}
          className={`
            p-2 rounded-lg transition-colors
            ${isFavorite 
              ? 'text-[#D4AF37]' 
              : 'text-[#8C7F72] hover:text-[#D4AF37]'
            }
          `}
        >
          <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        <Link
          href={`/rectify/${session.id}${session.status === 'complete' ? '/results' : ''}`}
          className="p-2 text-[#8C7F72] hover:text-[#D4AF37] rounded-lg transition-colors"
        >
          <ExternalLink className="w-5 h-5" />
        </Link>
      </div>
    </motion.div>
  );
}
