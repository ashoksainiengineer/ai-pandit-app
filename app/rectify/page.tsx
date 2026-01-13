'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, MapPin, User, Activity, Sparkles,
  ArrowRight, ArrowLeft, Check, Loader2, Sigma, FunctionSquare
} from 'lucide-react';
import type { BirthData, PhysicalDescription, LifeEvent, RectificationResult } from '@/types';
import StepIndicator from '@/components/StepIndicator';
import BirthDataForm from '@/components/BirthDataForm';
import PhysicalTraitsForm from '@/components/PhysicalTraitsForm';
import LifeEventsForm from '@/components/LifeEventsForm';
import ProcessingAnimation from '@/components/ProcessingAnimation';
import ResultsDisplay from '@/components/ResultsDisplay';
import LivePreviewPanel from '@/components/LivePreviewPanel';

export default function BTRPage() {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RectificationResult | null>(null);
  
  const [birthData, setBirthData] = useState<Partial<BirthData>>({
    fullName: '',
    dateOfBirth: '',
    tentativeTime: '',
    timeUncertainty: 'exact',
    birthPlace: '',
    latitude: 0,
    longitude: 0,
    timezone: 'UTC+5:30',
    gender: 'male',
    currentAge: 0
  });
  
  const [physicalDesc, setPhysicalDesc] = useState<Partial<PhysicalDescription>>({
    bodyStructure: 'average',
    height: 'average',
    faceShape: 'oval',
    complexion: 'wheatish',
    distinctiveFeatures: ''
  });
  
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  
  const handleSubmit = async () => {
    setIsProcessing(true);
    setStep(4);
    
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthData, physicalDescription: physicalDesc, lifeEvents })
      });
      
      const data = await response.json();
      if (data.success) {
        setResult(data.result);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const canProceed = () => {
    switch (step) {
      case 1:
        return birthData.fullName && birthData.dateOfBirth && birthData.tentativeTime && birthData.birthPlace;
      case 2:
        return true;
      case 3:
        return lifeEvents.length >= 3;
      default:
        return false;
    }
  };
  
  const renderStep = () => {
    const variants = {
      initial: { opacity: 0, x: 89 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -89 }
    };
    
    switch (step) {
      case 1:
        return (
          <motion.div
            key="birth-data"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.618, ease: "easeInOut" }}
            className="w-full max-w-4xl mx-auto"
          >
            <BirthDataForm birthData={birthData} setBirthData={setBirthData} />
          </motion.div>
        );
        
      case 2:
        return (
          <motion.div
            key="physical-traits"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.618, ease: "easeInOut" }}
            className="w-full max-w-4xl mx-auto"
          >
            <PhysicalTraitsForm physicalDesc={physicalDesc} setPhysicalDesc={setPhysicalDesc} />
          </motion.div>
        );
        
      case 3:
        return (
          <motion.div
            key="life-events"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.618, ease: "easeInOut" }}
            className="w-full max-w-4xl mx-auto"
          >
            <LifeEventsForm lifeEvents={lifeEvents} setLifeEvents={setLifeEvents} />
          </motion.div>
        );
        
      case 4:
        return (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.618 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.618, ease: "easeInOut" }}
            className="w-full flex justify-center"
          >
            {isProcessing ? (
              <ProcessingAnimation />
            ) : result ? (
              <ResultsDisplay result={result} />
            ) : (
              <div className="text-center py-fib-9">
                <p className="text-h4 text-white/phi">Something went wrong. Please try again.</p>
              </div>
            )}
          </motion.div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Subtle Celestial Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full filter blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full filter blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 6, delay: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      {/* Header with Progress */}
      <header className="relative z-10 py-8 border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4"
            >
              <h1 className="text-4xl font-bold text-white mb-2">
                Birth Time Rectification
              </h1>
              <p className="text-lg text-white/70">
                Let's find your exact birth time through Vedic astrology
              </p>
            </motion.div>
          </div>
          
          {step < 4 && <StepIndicator currentStep={step} totalSteps={4} />}
        </div>
      </header>
      
      {/* Main Content - Conversational Flow */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
        
        {/* Navigation - Simple and Clear */}
        {step < 4 && (
          <motion.div
            className="flex justify-between mt-12 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 text-white font-medium"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
            ) : <div />}
            
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-300 text-white font-medium"
              >
                Next <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-300 text-white font-medium text-lg"
              >
                <Sparkles className="w-6 h-6" /> Find My Birth Time
              </button>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="relative z-10 py-8 mt-16 border-t border-white/10 backdrop-blur-md bg-black/20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-white/60 text-sm">
            Powered by authentic Vedic astrology principles • Swiss Ephemeris • K.P. System • ML Engine • Vimshottari Dasha
          </p>
        </div>
      </footer>
    </main>
  );
}