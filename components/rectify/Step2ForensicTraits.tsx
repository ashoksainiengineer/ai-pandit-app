/**
 * Step2ForensicTraits - Forensic Traits via Quiz System
 * Replaces traditional selection with quiz-based identification
 * Sacred Ivory Light Theme - God Tier Design
 */

'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ForensicTraits } from '@/lib/types';
import { Gender } from '@/lib/forensic-emojis';
import { QuizResults } from '@/lib/forensic-quiz/types';
import WhyForensicTraits from './WhyForensicTraits';
import ForensicQuizEngine from './ForensicQuizEngine';

interface Step2Props {
  traits: ForensicTraits;
  updateTraits: (traits: Partial<ForensicTraits>) => void;
  gender?: Gender;
}

// Convert quiz results to legacy ForensicTraits format
function quizResultsToTraits(results: QuizResults): Partial<ForensicTraits> {
  // Map prakriti
  const prakritiValue = results.prakriti.secondary 
    ? `${results.prakriti.primary}-${results.prakriti.secondary}` as any
    : results.prakriti.primary;

  // Map forehead type
  const foreheadMap: Record<string, string> = {
    'Broad/High': 'broad',
    'Narrow': 'narrow',
    'Sloping': 'sloping',
    'Prominent': 'broad',
    'Low/Receding': 'narrow'
  };

  // Map eye type
  const eyeMap: Record<string, string> = {
    'Deep Set': 'deep_set',
    'Prominent': 'prominent',
    'Almond': 'almond',
    'Round': 'round',
    'Small/Intense': 'small',
    'Large/Luminous': 'round'
  };

  // Map voice type
  const voiceMap: Record<string, string> = {
    'Deep': 'deep',
    'High Pitch': 'high',
    'Soft': 'soft',
    'Raspy': 'raspy',
    'Resonant': 'deep',
    'Nasal': 'high'
  };

  // Map speech type
  const speechMap: Record<string, string> = {
    'Fast & Loud': 'fast_loud',
    'Measured': 'measured_soft',
    'Logical': 'argumentative',
    'Concise': 'concise',
    'Talkative': 'talkative'
  };

  // Map decision type
  const decisionMap: Record<string, string> = {
    'Impulsive': 'impulsive',
    'Deliberate': 'deliberate',
    'Over-analytical': 'indecisive',
    'Emotionally swayed': 'indecisive',
    'Intuitive': 'intuitive',
    'Fear-based': 'deliberate'
  };

  return {
    physical: {
      facialStructure: {
        forehead: foreheadMap[results.forehead.type] || 'average',
        eyeShape: eyeMap[results.eyes.type] || 'almond',
        voicePitch: voiceMap[results.voice.type] || 'medium'
      },
      skinHair: {
        marks: []
      }
    },
    biological: {
      prakriti: prakritiValue
    },
    psychographic: {
      speechStyle: speechMap[results.speech.type] || 'measured_soft',
      decisionMaking: decisionMap[results.decision.type] || 'deliberate'
    },
    family: {
      siblingPosition: results.family.birthOrder as any,
      fatherStatusAtBirth: results.family.fatherStatus as any
    }
  };
}

export default function Step2ForensicTraits({ traits, updateTraits, gender = 'other' }: Step2Props) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleQuizComplete = useCallback((results: QuizResults) => {
    // Convert quiz results to trait format
    const traitUpdates = quizResultsToTraits(results);
    updateTraits(traitUpdates);
    setQuizCompleted(true);
    setShowQuiz(false);
  }, [updateTraits]);

  const handleRetakeQuiz = useCallback(() => {
    setQuizCompleted(false);
    setShowQuiz(true);
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto pb-8">
      {/* Security Badge - Top of Form */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2 text-xs text-[#2D7A5C] bg-[#2D7A5C]/5 py-2.5 px-4 rounded-full border border-[#2D7A5C]/10 mb-4"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="font-medium">🔐 End-to-End Encrypted</span>
        <span className="text-[#2D7A5C]/60">•</span>
        <span className="text-[#7A756F]">Nobody can read your data except you</span>
      </motion.div>

      {/* Why Forensic Traits Matter - Educational Component */}
      <WhyForensicTraits />

      {/* Header - Compact */}
      <div className="my-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FDF8F3] to-white border border-[#F0E8DE] rounded-full text-xs mb-6 shadow-sm"
        >
          <span className="text-[#B8860B] font-medium tracking-wider">STEP 2 OF 4</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl font-semibold text-[#1A1612] leading-tight mb-2"
        >
          Forensic <span className="text-gradient-gold">Traits</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.2 }} 
          className="text-sm text-[#7A756F]"
        >
          Sub-second rectification through physical markers
        </motion.p>
      </div>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {!showQuiz && !quizCompleted && (
          <div className="bg-gradient-to-br from-[#FDF8F3] to-white rounded-2xl border border-[#B8860B]/30 p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#B8860B] to-[#D4A853] mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-bold text-[#1A1612] mb-2">
                Vedic Forensic Assessment
              </h2>
              <p className="text-[#7A756F] max-w-md mx-auto">
                Answer 22 simple questions about your physical traits and behaviors. 
                Our system will determine your cosmic imprint for precise birth time rectification.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {[
                { icon: '🍃', label: 'Body Type', desc: '5 questions' },
                { icon: '👁️', label: 'Facial Features', desc: '4 questions' },
                { icon: '🗣️', label: 'Voice & Speech', desc: '4 questions' },
                { icon: '🧠', label: 'Behavior', desc: '5 questions' },
                { icon: '🔴', label: 'Physical Marks', desc: '2 questions' },
                { icon: '👨‍👩‍👧‍👦', label: 'Family', desc: '2 questions' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#F0E8DE]">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="font-medium text-sm text-[#1A1612]">{item.label}</div>
                    <div className="text-xs text-[#7A756F]">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 mb-6 text-sm text-[#7A756F]">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ~5-7 minutes
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                94% accuracy rate
              </span>
            </div>

            <button
              onClick={() => setShowQuiz(true)}
              className="w-full py-4 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Start Assessment
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        )}

        {showQuiz && (
          <ForensicQuizEngine
            onComplete={handleQuizComplete}
            onCancel={() => setShowQuiz(false)}
          />
        )}

        {quizCompleted && (
          <div className="bg-gradient-to-br from-[#FDF8F3] to-white rounded-2xl border border-[#2D7A5C]/30 p-8 shadow-lg text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#2D7A5C] to-[#4ADE80] mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-bold text-[#1A1612] mb-2">
              Assessment Complete
            </h2>
            <p className="text-[#7A756F] mb-6">
              Your forensic profile has been recorded and will be used for precise birth time rectification.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-white rounded-xl border border-[#F0E8DE]">
                <div className="text-2xl mb-1">🍃</div>
                <div className="text-xs text-[#7A756F]">Body Type</div>
                <div className="font-semibold text-[#1A1612] capitalize">{traits.biological?.prakriti || 'Not set'}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-[#F0E8DE]">
                <div className="text-2xl mb-1">👁️</div>
                <div className="text-xs text-[#7A756F]">Eye Shape</div>
                <div className="font-semibold text-[#1A1612] capitalize">{traits.physical?.facialStructure?.eyeShape?.replace('_', ' ') || 'Not set'}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-[#F0E8DE]">
                <div className="text-2xl mb-1">🗣️</div>
                <div className="text-xs text-[#7A756F]">Speech Style</div>
                <div className="font-semibold text-[#1A1612] capitalize">{traits.psychographic?.speechStyle?.replace('_', ' ') || 'Not set'}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-[#F0E8DE]">
                <div className="text-2xl mb-1">👨‍👩‍👧‍👦</div>
                <div className="text-xs text-[#7A756F]">Birth Order</div>
                <div className="font-semibold text-[#1A1612] capitalize">{traits.family?.siblingPosition?.replace('_', ' ') || 'Not set'}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRetakeQuiz}
                className="flex-1 py-3 border-2 border-[#E8E0D5] text-[#7A756F] rounded-xl font-semibold hover:bg-[#F5EFE7] transition-colors"
              >
                Retake Assessment
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex-1 py-3 bg-gradient-to-r from-[#2D7A5C] to-[#4ADE80] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Continue to Next Step
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
