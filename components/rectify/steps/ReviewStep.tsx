'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Heart,
  GraduationCap,
  Briefcase,
  Baby,
  Users,
  Stethoscope,
  Landmark,
  Plane,
  Target,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { BirthData, LifeEvent, PhysicalTraits, EventCategory } from '../../../lib/types';

interface ReviewStepProps {
  birthData: BirthData;
  lifeEvents: LifeEvent[];
  physicalTraits?: PhysicalTraits;
  onConfirm: () => void;
  isProcessing?: boolean;
}

const CATEGORY_CONFIG: Record<EventCategory, { icon: React.ComponentType<any>; color: string; emoji: string }> = {
  education: { icon: GraduationCap, color: 'blue-400', emoji: '📚' },
  career: { icon: Briefcase, color: 'green-400', emoji: '💼' },
  marriage: { icon: Heart, color: 'pink-400', emoji: '💍' },
  children: { icon: Baby, color: 'purple-400', emoji: '👶' },
  family: { icon: Users, color: 'orange-400', emoji: '👨‍👩‍👧' },
  health: { icon: Stethoscope, color: 'red-400', emoji: '🏥' },
  financial: { icon: Landmark, color: 'yellow-400', emoji: '💰' },
  travel: { icon: Plane, color: 'cyan-400', emoji: '✈️' },
  spiritual: { icon: Target, color: 'indigo-400', emoji: '🕉️' },
  other: { icon: Target, color: 'gray-400', emoji: '📌' }
};

export default function ReviewStep({
  birthData,
  lifeEvents,
  physicalTraits,
  onConfirm,
  isProcessing = false
}: ReviewStepProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-white mb-2">Review & Confirm</h2>
        <p className="text-gray-300">Please review all the information before proceeding with the analysis</p>
      </motion.div>

      {/* Birth Details Section */}
      <motion.div variants={itemVariants} className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Birth Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Full Name:</span>
            <p className="text-white font-medium">{birthData.fullName}</p>
          </div>
          <div>
            <span className="text-gray-400">Date of Birth:</span>
            <p className="text-white font-medium">
              {new Date(birthData.dateOfBirth).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Tentative Time:</span>
            <p className="text-white font-medium">{birthData.tentativeTime}</p>
          </div>
          <div>
            <span className="text-gray-400">Time Uncertainty:</span>
            <p className="text-white font-medium">{birthData.timeUncertainty}</p>
          </div>
          <div>
            <span className="text-gray-400">Birth Place:</span>
            <p className="text-white font-medium flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {birthData.birthPlace}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Gender:</span>
            <p className="text-white font-medium capitalize">{birthData.gender}</p>
          </div>
          <div className="md:col-span-2">
            <span className="text-gray-400">Timezone:</span>
            <p className="text-white font-medium flex items-center gap-1">
              <Globe className="w-4 h-4" />
              {birthData.timezone}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Life Events Section */}
      <motion.div variants={itemVariants} className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Life Events ({lifeEvents.length})
        </h3>
        <div className="space-y-3">
          {lifeEvents.map((event, index) => {
            const config = CATEGORY_CONFIG[event.category];
            const IconComponent = config.icon;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-slate-600/30 rounded-lg"
              >
                <div className={`p-2 rounded-lg bg-${config.color}/20 flex-shrink-0`}>
                  <IconComponent className={`w-4 h-4 text-${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{config.emoji}</span>
                    <h4 className="font-medium text-white text-sm">{event.eventType}</h4>
                    <span className={`px-2 py-1 rounded text-xs bg-${config.color}/20 text-${config.color}`}>
                      {event.category}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{event.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.eventDate).toLocaleDateString()}
                    </span>
                    {event.eventTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.eventTime}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs bg-slate-600 capitalize`}>
                      {event.importance}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Physical Traits Section (if provided) */}
      {physicalTraits && (
        <motion.div variants={itemVariants} className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Physical Characteristics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {physicalTraits.height && (
              <div>
                <span className="text-gray-400">Height:</span>
                <p className="text-white font-medium capitalize">{physicalTraits.height}</p>
              </div>
            )}
            {physicalTraits.build && (
              <div>
                <span className="text-gray-400">Build:</span>
                <p className="text-white font-medium capitalize">{physicalTraits.build}</p>
              </div>
            )}
            {physicalTraits.complexion && (
              <div>
                <span className="text-gray-400">Complexion:</span>
                <p className="text-white font-medium capitalize">{physicalTraits.complexion}</p>
              </div>
            )}
          </div>
          {(physicalTraits.appearance || physicalTraits.marks) && (
            <div className="mt-4 space-y-2">
              {physicalTraits.appearance && (
                <div>
                  <span className="text-gray-400 text-sm">Appearance:</span>
                  <p className="text-white text-sm mt-1">{physicalTraits.appearance}</p>
                </div>
              )}
              {physicalTraits.marks && (
                <div>
                  <span className="text-gray-400 text-sm">Marks/Scars:</span>
                  <p className="text-white text-sm mt-1">{physicalTraits.marks}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Action Section */}
      <motion.div variants={itemVariants} className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Ready to Process</h3>
        <p className="text-gray-300 text-sm mb-6">
          Click the button below to start the birth time rectification analysis.
          This process may take a few minutes as it analyzes your data with advanced AI algorithms.
        </p>

        <motion.button
          onClick={onConfirm}
          disabled={isProcessing}
          whileHover={{ scale: isProcessing ? 1 : 1.02 }}
          whileTap={{ scale: isProcessing ? 1 : 0.98 }}
          className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing & Analyzing...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Process & Analyze Birth Time
            </>
          )}
        </motion.button>

        {isProcessing && (
          <p className="text-sm text-blue-400 mt-3 text-center">
            This may take 2-5 minutes. Please don't close this page.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
