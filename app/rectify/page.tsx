'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
<<<<<<< HEAD
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
  
=======
import type { BirthData, PhysicalDescription, LifeEvent, RectificationResult } from '@/types';
import Header from '@/components/rectify/Header';
import BirthDetailsStep from '@/components/rectify/steps/BirthDetailsStep';
import PhysicalStep from '@/components/rectify/steps/PhysicalStep';
import LifeEventsStep from '@/components/rectify/steps/LifeEventsStep';
import LifeEventsStepUniversal from '@/components/rectify/steps/LifeEventsStepUniversal';
import ReviewStep from '@/components/rectify/steps/ReviewStep';
import ResultsPage from '@/components/rectify/ResultsPage';
import { validateFormSubmission } from '@/lib/validators';
import { calculateProgress, getProgressColor, getProgressMessage } from '@/lib/progressCalculator';

export default function RectifyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RectificationResult | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  // Form state
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
  const [birthData, setBirthData] = useState<Partial<BirthData>>({
    fullName: '',
    dateOfBirth: '',
    tentativeTime: '',
<<<<<<< HEAD
    timeUncertainty: 'exact',
=======
    timeUncertainty: '30min',
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
    birthPlace: '',
    latitude: 0,
    longitude: 0,
    timezone: 'UTC+5:30',
    gender: 'male',
<<<<<<< HEAD
    currentAge: 0
  });
  
=======
    maritalStatus: 'single',
    currentAge: 0
  });

>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
  const [physicalDesc, setPhysicalDesc] = useState<Partial<PhysicalDescription>>({
    bodyStructure: 'average',
    height: 'average',
    faceShape: 'oval',
    complexion: 'wheatish',
    distinctiveFeatures: ''
  });
<<<<<<< HEAD
  
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  
  const handleSubmit = async () => {
    setIsProcessing(true);
    setStep(4);
    
=======

  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);

  // Auto-save to localStorage
  useEffect(() => {
    const saveData = () => {
      localStorage.setItem('rectify_birth_data', JSON.stringify(birthData));
      localStorage.setItem('rectify_physical_desc', JSON.stringify(physicalDesc));
      localStorage.setItem('rectify_life_events', JSON.stringify(lifeEvents));
      setLastSaved(new Date());
    };
    const timer = setTimeout(saveData, 500);
    return () => clearTimeout(timer);
  }, [birthData, physicalDesc, lifeEvents]);

  // Calculate overall progress whenever data changes
  useEffect(() => {
    const progress = calculateProgress(birthData, physicalDesc, lifeEvents);
    setOverallProgress(progress.percentage);
  }, [birthData, physicalDesc, lifeEvents]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved_birth = localStorage.getItem('rectify_birth_data');
    const saved_physical = localStorage.getItem('rectify_physical_desc');
    const saved_events = localStorage.getItem('rectify_life_events');

    if (saved_birth) setBirthData(JSON.parse(saved_birth));
    if (saved_physical) setPhysicalDesc(JSON.parse(saved_physical));
    if (saved_events) setLifeEvents(JSON.parse(saved_events));
  }, []);

  const handleSubmit = async () => {
    // Clear previous validation errors
    setValidationErrors([]);

    // Validate form data before submission
    const validation = validateFormSubmission(birthData, physicalDesc, lifeEvents);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(error => error.message);
      setValidationErrors(errorMessages);
      
      // Show validation errors to user
      alert('Please fix the following errors:\n\n' + errorMessages.join('\n• '));
      return;
    }

    setIsProcessing(true);
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
<<<<<<< HEAD
        body: JSON.stringify({ birthData, physicalDescription: physicalDesc, lifeEvents })
      });
      
      const data = await response.json();
      if (data.success) {
        setResult(data.result);
      }
    } catch (error) {
      console.error('Error:', error);
=======
        body: JSON.stringify({
          birthData,
          physicalDescription: physicalDesc,
          lifeEvents
        })
      });

      if (!response.ok) {
        let errorMessage = `API error: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // If response.json() fails, use the status-based message
          console.warn('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Calculation failed');
      }

      setResult(data.result);
    } catch (error) {
      console.error('Calculation error:', error);
      
      // More user-friendly error messages
      let errorMessage = 'Error during calculation. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('validation')) {
          errorMessage = 'Please check your input data and try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('coordinate')) {
          errorMessage = 'Location error. Please check your birth place coordinates.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
    } finally {
      setIsProcessing(false);
    }
  };
<<<<<<< HEAD
  
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
=======

  // If results are ready, show results page
  if (result) {
    return <ResultsPage result={result} onRestart={() => setResult(null)} />;
  }

  // Multi-step form
  return (
    <div className="min-h-screen bg-[#0F1419]">
      <Header currentStep={currentStep} totalSteps={4} />

      <main className="pt-[120px] pb-[140px] px-4">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <BirthDetailsStep birthData={birthData} setBirthData={setBirthData} />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PhysicalStep physicalDesc={physicalDesc} setPhysicalDesc={setPhysicalDesc} />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LifeEventsStepUniversal
                  lifeEvents={lifeEvents}
                  setLifeEvents={setLifeEvents}
                  birthYear={birthData.dateOfBirth ? parseInt(birthData.dateOfBirth.split('-')[0]) : undefined}
                  maritalStatus={birthData.maritalStatus}
                  overallProgress={overallProgress}
                />
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ReviewStep
                  birthData={birthData}
                  physicalDesc={physicalDesc}
                  lifeEvents={lifeEvents}
                  onEdit={(step) => setCurrentStep(step)}
                  onSubmit={handleSubmit}
                  isProcessing={isProcessing}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#1A1F26] border-t border-[#2D3542] px-4 py-4 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-3 rounded-lg border border-[#3D4654] text-[#A8B3C5] hover:text-[#F7F9FC] hover:border-[#A8B3C5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            ← Back
          </button>

          <div className="text-xs text-[#6B7A90]">
            {lastSaved && `💾 Saved just now`}
          </div>

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#F5A623] to-[#E09000] text-[#0F1419] hover:shadow-lg hover:shadow-[#F5A623]/30 transition-all font-semibold"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isProcessing || lifeEvents.length < 3}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#F5A623] to-[#E09000] text-[#0F1419] hover:shadow-lg hover:shadow-[#F5A623]/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0F1419]/30 border-t-[#0F1419] rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>🔮 Calculate Birth Time</>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
  );
}