'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, User, SkipForward, ChevronDown } from 'lucide-react';
import { PhysicalTraits } from '../../../lib/types';

interface PhysicalStepProps {
  physicalTraits?: PhysicalTraits;
  setPhysicalTraits: (traits: PhysicalTraits) => void;
  onContinue: () => void;
  isOptional?: boolean;
}

const HEIGHT_OPTIONS = ['very short', 'short', 'medium', 'tall', 'very tall'] as const;
const BUILD_OPTIONS = ['thin', 'lean', 'medium', 'heavy', 'obese'] as const;
const COMPLEXION_OPTIONS = ['very fair', 'fair', 'medium', 'dark', 'very dark'] as const;

export default function PhysicalStep({
  physicalTraits,
  setPhysicalTraits,
  onContinue,
  isOptional = true
}: PhysicalStepProps) {
  const updateTrait = (key: keyof PhysicalTraits, value: string) => {
    setPhysicalTraits({
      ...physicalTraits,
      [key]: value
    } as PhysicalTraits);
  };

  const hasAnyTraits = physicalTraits &&
    (physicalTraits.height || physicalTraits.build || physicalTraits.complexion ||
     physicalTraits.appearance || physicalTraits.marks);

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
        <h2 className="text-2xl font-semibold text-white mb-2">Physical Characteristics</h2>
        <p className="text-gray-300">
          {isOptional
            ? "These details can improve accuracy but are completely optional"
            : "Please provide your physical characteristics"
          }
        </p>
        {isOptional && (
          <p className="text-sm text-blue-400 mt-2">Skip this step if you prefer not to share</p>
        )}
      </motion.div>

      {/* Height */}
      <motion.div variants={itemVariants} className="space-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <User className="w-4 h-4" />
          Height
        </label>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {HEIGHT_OPTIONS.map(option => (
            <button
              key={option}
              onClick={() => updateTrait('height', option)}
              className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                physicalTraits?.height === option
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:border-blue-400'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Build */}
      <motion.div variants={itemVariants} className="space-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <User className="w-4 h-4" />
          Build
        </label>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {BUILD_OPTIONS.map(option => (
            <button
              key={option}
              onClick={() => updateTrait('build', option)}
              className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                physicalTraits?.build === option
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:border-blue-400'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Complexion */}
      <motion.div variants={itemVariants} className="space-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <User className="w-4 h-4" />
          Complexion
        </label>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {COMPLEXION_OPTIONS.map(option => (
            <button
              key={option}
              onClick={() => updateTrait('complexion', option)}
              className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                physicalTraits?.complexion === option
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:border-blue-400'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={itemVariants} className="space-y-2">
        <label className="text-sm text-gray-300">General Appearance (Optional)</label>
        <textarea
          value={physicalTraits?.appearance || ''}
          onChange={(e) => updateTrait('appearance', e.target.value)}
          placeholder="e.g., athletic build, prominent nose, etc."
          rows={2}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors resize-none"
        />
      </motion.div>

      {/* Marks */}
      <motion.div variants={itemVariants} className="space-y-2">
        <label className="text-sm text-gray-300">Birth Marks or Scars (Optional)</label>
        <textarea
          value={physicalTraits?.marks || ''}
          onChange={(e) => updateTrait('marks', e.target.value)}
          placeholder="e.g., mole on left cheek, scar on right hand, etc."
          rows={2}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors resize-none"
        />
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="pt-6 space-y-3">
        <motion.button
          onClick={onContinue}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {hasAnyTraits ? 'Continue with These Details' : 'Continue without Physical Details'}
          <ChevronDown className="w-5 h-5" />
        </motion.button>

        {isOptional && (
          <motion.button
            onClick={onContinue}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full px-6 py-4 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <SkipForward className="w-5 h-5" />
            Skip This Step
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
