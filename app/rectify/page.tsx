'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, MapPin, User, Activity, Sparkles,
  ArrowRight, ArrowLeft, Check, Loader2, Sigma, FunctionSquare
} from 'lucide-react';
import { useAuth, useUser, SignUpButton } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import type { BirthData, PhysicalDescription, LifeEvent, RectificationResult } from '@/types';
import StepIndicator from '@/components/StepIndicator';
import BirthDataForm from '@/components/BirthDataForm';
import PhysicalTraitsForm from '@/components/PhysicalTraitsForm';
import LifeEventsForm from '@/components/LifeEventsForm';
import ProcessingAnimation from '@/components/ProcessingAnimation';
import ResultsDisplay from '@/components/ResultsDisplay';
import LivePreviewPanel from '@/components/LivePreviewPanel';
import { RealTimeDisplay } from '@/components/RealTimeDisplay';
import { validateFormSubmission } from '@/lib/validators';
import { calculateProgress, getProgressColor, getProgressMessage } from '@/lib/progressCalculator';
import { combineDateTimeToISO, createValidDate } from '@/lib/dateUtils';

// Storage keys for form data persistence
const STORAGE_KEYS = {
  BIRTH_DATA: 'btr_birth_data',
  PHYSICAL_DATA: 'btr_physical_data',
  EVENTS_DATA: 'btr_events_data',
  PENDING_ANALYSIS: 'btr_pending_analysis',
  FORM_TIMESTAMP: 'btr_form_timestamp'
};

export default function RectifyPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RectificationResult | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showAuthLoading, setShowAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('Signing you in to see your results...');

  // Form state
  const [birthData, setBirthData] = useState<Partial<BirthData>>({
    fullName: '',
    dateOfBirth: '',
    tentativeTime: '',
    timeUncertainty: undefined, // Start undefined to force selection
    birthPlace: '',
    latitude: 0,
    longitude: 0,
    timezone: 'UTC+5:30',
    gender: undefined, // Start undefined to force selection
    maritalStatus: 'single',
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

  // Enhanced data persistence with timestamp
  const saveFormData = () => {
    const timestamp = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.BIRTH_DATA, JSON.stringify(birthData));
    localStorage.setItem(STORAGE_KEYS.PHYSICAL_DATA, JSON.stringify(physicalDesc));
    localStorage.setItem(STORAGE_KEYS.EVENTS_DATA, JSON.stringify(lifeEvents));
    localStorage.setItem(STORAGE_KEYS.FORM_TIMESTAMP, timestamp);
    setLastSaved(new Date(timestamp));
  };

  // Auto-save to localStorage with debouncing
  useEffect(() => {
    const timer = setTimeout(saveFormData, 500);
    return () => clearTimeout(timer);
  }, [birthData, physicalDesc, lifeEvents]);

  // Calculate overall progress whenever data changes
  useEffect(() => {
    const progress = calculateProgress(birthData, physicalDesc, lifeEvents);
    setOverallProgress(progress.percentage);
  }, [birthData, physicalDesc, lifeEvents]);

  // Load from localStorage on mount and check for auth redirect
  useEffect(() => {
    const loadFormData = () => {
      try {
        const saved_birth = localStorage.getItem(STORAGE_KEYS.BIRTH_DATA);
        const saved_physical = localStorage.getItem(STORAGE_KEYS.PHYSICAL_DATA);
        const saved_events = localStorage.getItem(STORAGE_KEYS.EVENTS_DATA);
        const timestamp = localStorage.getItem(STORAGE_KEYS.FORM_TIMESTAMP);

        if (saved_birth) setBirthData(JSON.parse(saved_birth));
        if (saved_physical) setPhysicalDesc(JSON.parse(saved_physical));
        if (saved_events) setLifeEvents(JSON.parse(saved_events));
        if (timestamp) setLastSaved(new Date(timestamp));
      } catch (error) {
        console.error('Error loading saved form data:', error);
        // Clear corrupted data
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      }
    };

    loadFormData();
  }, []);

  // Check for pending analysis after authentication
  useEffect(() => {
    const processPendingAnalysis = async () => {
      if (!isSignedIn || !isLoaded) return;

      const pending_analysis = localStorage.getItem(STORAGE_KEYS.PENDING_ANALYSIS);
      const hasRedirectParam = searchParams?.has('redirect_url');

      if (pending_analysis) {
        setShowAuthLoading(true);
        setAuthMessage('Signing you in to see your results...');
        
        try {
          const analysisData = JSON.parse(pending_analysis);
          
          // Show a brief message before processing
          setTimeout(async () => {
            setAuthMessage('Processing your birth time analysis...');
            await processAnalysis(analysisData);
            
            // Clear pending analysis after successful processing
            localStorage.removeItem(STORAGE_KEYS.PENDING_ANALYSIS);
            
            // Clean up URL parameters after processing
            if (hasRedirectParam) {
              router.replace('/rectify', { scroll: false });
            }
          }, 1500); // Brief delay for better UX
        } catch (error) {
          console.error('Error processing pending analysis:', error);
          setShowAuthLoading(false);
          alert('Error processing your analysis. Please try again.');
        }
      }
    };

    processPendingAnalysis();
  }, [isSignedIn, isLoaded, searchParams, router]);

  const processAnalysis = async (data: any) => {
    setIsProcessing(true);
    setStep(4);
    setShowAuthLoading(false);
    
    try {
      // Transform birth data to include proper date object
      const transformedData = transformBirthDataForAPI(data);
      
      console.log('🔄 Processing analysis with transformed data:', {
        hasBirthData: !!transformedData.birthData,
        hasDate: !!transformedData.birthData?.date,
        eventCount: transformedData.lifeEvents?.length || 0
      });

      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformedData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const resultData = await response.json();
      if (!resultData.success) throw new Error(resultData.error || 'Calculation failed');

      setResult(resultData.result);
      
      // Save to database if user is authenticated
      if (isSignedIn && user) {
        await saveToDatabase(resultData.result, transformedData);
      }
      
      // Clear form data after successful analysis
      clearFormData();
    } catch (error) {
      console.error('Analysis error:', error);
      alert(`Error during analysis: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const transformBirthDataForAPI = (data: any) => {
    try {
      const { birthData, physicalDescription, lifeEvents } = data;
      
      if (!birthData?.dateOfBirth || !birthData?.tentativeTime) {
        throw new Error('Missing required birth data: dateOfBirth and tentativeTime are required');
      }

      // Combine date and time into a single ISO string
      const dateTimeISO = combineDateTimeToISO(birthData.dateOfBirth, birthData.tentativeTime);
      
      if (!dateTimeISO) {
        throw new Error(`Invalid date/time combination: ${birthData.dateOfBirth} ${birthData.tentativeTime}`);
      }

      // Create transformed data object
      const transformedData = {
        birthData: {
          ...birthData,
          date: dateTimeISO, // Add the combined date/time for API consumption
        },
        physicalDescription: physicalDescription || {},
        lifeEvents: lifeEvents || []
      };

      console.log('✅ Data transformation successful:', {
        originalDate: birthData.dateOfBirth,
        originalTime: birthData.tentativeTime,
        transformedDateTime: dateTimeISO
      });

      return transformedData;
    } catch (error) {
      console.error('❌ Data transformation error:', error);
      throw error;
    }
  };

  const saveToDatabase = async (result: RectificationResult, formData: any) => {
    try {
      const response = await fetch('/api/save-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          birthData: formData.birthData,
          physicalDescription: formData.physicalDescription,
          lifeEvents: formData.lifeEvents,
          result
        })
      });

      if (!response.ok) throw new Error('Failed to save to database');
      
      console.log('✅ Calculation saved to database');
    } catch (error) {
      console.error('Database save error:', error);
    }
  };

  const clearFormData = () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  };

  const handleSubmit = async () => {
    // Clear previous validation errors
    setValidationErrors([]);

    // Validate form data before submission
    const validation = validateFormSubmission(birthData, physicalDesc, lifeEvents);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(error => error.message);
      setValidationErrors(errorMessages);
      alert('Please fix the following errors:\n\n' + errorMessages.join('\n• '));
      return;
    }

    const analysisData = {
      birthData,
      physicalDescription: physicalDesc,
      lifeEvents
    };
    
    // Persist data before any action
    localStorage.setItem(STORAGE_KEYS.PENDING_ANALYSIS, JSON.stringify(analysisData));

    // if user is signed in, process immediately
    if (isSignedIn) {
      await processAnalysis(analysisData);
    } 
    // If user is not signed in, the SignUpButton will handle the redirect.
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        // All fields are mandatory: name, date, time, time uncertainty, birth place, and gender
        return birthData.fullName &&
               birthData.fullName.trim().length >= 2 &&
               birthData.dateOfBirth &&
               birthData.tentativeTime &&
               birthData.timeUncertainty && // Time uncertainty must be selected
               birthData.birthPlace &&
               birthData.birthPlace.trim().length >= 2 &&
               birthData.gender; // Gender must be selected
      case 2:
        return true;
      case 3:
        return lifeEvents.length >= 3;
      default:
        return false;
    }
  };

  // Optimized navigation handler with debouncing
  const handleNext = () => {
    if (isNavigating || !canProceed()) return;
    
    setIsNavigating(true);
    setStep(prev => Math.min(prev + 1, 3));
    
    // Reset navigation lock after animation completes
    setTimeout(() => {
      setIsNavigating(false);
    }, 700);
  };

  const handlePrevious = () => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    setStep(prev => Math.max(prev - 1, 1));
    
    // Reset navigation lock after animation completes
    setTimeout(() => {
      setIsNavigating(false);
    }, 700);
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
              <RealTimeDisplay onComplete={(report) => {
                // Convert FinalBTRReport to RectificationResult if needed
                // For now, just complete the processing
                setIsProcessing(false);
              }} />
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

  if (showAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl max-w-md mx-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-3">Almost there!</h2>
          <p className="text-white/80 text-lg">{authMessage}</p>
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <header className="relative z-10 py-4 md:py-8 border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-4 md:mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Birth Time Rectification
              </h1>
              <p className="text-base md:text-lg text-white/70">
                Let's find your exact birth time through Vedic astrology
              </p>
            </motion.div>
          </div>
          
          {step < 4 && <StepIndicator currentStep={step} totalSteps={4} />}
        </div>
      </header>
      
      {/* Main Content - Conversational Flow */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
        
        {/* Navigation - Simple and Clear */}
        {step < 4 && (
          <motion.div
            className="flex flex-col sm:flex-row justify-between items-center mt-8 md:mt-12 max-w-4xl mx-auto space-y-4 sm:space-y-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {step > 1 ? (
              <button
                onClick={handlePrevious}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 text-white font-medium h-11"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
            ) : <div className="w-full sm:w-auto"/>}
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-300 text-white font-medium h-11"
              >
                Next <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
                <div onClick={handleSubmit} className="w-full sm:w-auto">
                    <SignUpButton mode="redirect" redirectUrl="/rectify">
                        <button
                            disabled={!canProceed()}
                            className="w-full flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-300 text-white font-medium text-lg h-12"
                        >
                            <Sparkles className="w-6 h-6" /> Find My Birth Time
                        </button>
                    </SignUpButton>
                </div>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="relative z-10 py-6 md:py-8 mt-12 md:mt-16 border-t border-white/10 backdrop-blur-md bg-black/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-white/60 text-xs sm:text-sm">
            Powered by authentic Vedic astrology principles • Swiss Ephemeris • K.P. System • ML Engine • Vimshottari Dasha
          </p>
        </div>
      </footer>
    </main>
  );
}
