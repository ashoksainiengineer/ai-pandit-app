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

const STORAGE_KEYS = {
  BIRTH_DATA: 'btr_birth_data',
  PHYSICAL_DATA: 'btr_physical_data',
  EVENTS_DATA: 'btr_events_data',
  PENDING_ANALYSIS: 'btr_pending_analysis',
  FORM_TIMESTAMP: 'btr_form_timestamp'
};

export default function RectifyPageContent() {
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

  const [birthData, setBirthData] = useState<Partial<BirthData>>({
    fullName: '',
    dateOfBirth: '',
    tentativeTime: '',
    timeUncertainty: '1hour', // Default to 1 hour
    birthPlace: '',
    latitude: 0,
    longitude: 0,
    timezone: 'Asia/Kolkata',
    gender: undefined,
  });

  const [physicalDesc, setPhysicalDesc] = useState<Partial<PhysicalDescription>>({
    bodyStructure: 'average',
    height: 'average',
    faceShape: 'oval',
    complexion: 'wheatish',
    distinctiveFeatures: ''
  });

  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);

  const saveFormData = () => {
    const timestamp = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.BIRTH_DATA, JSON.stringify(birthData));
    localStorage.setItem(STORAGE_KEYS.PHYSICAL_DATA, JSON.stringify(physicalDesc));
    localStorage.setItem(STORAGE_KEYS.EVENTS_DATA, JSON.stringify(lifeEvents));
    localStorage.setItem(STORAGE_KEYS.FORM_TIMESTAMP, timestamp);
    setLastSaved(new Date(timestamp));
  };

  useEffect(() => {
    const timer = setTimeout(saveFormData, 500);
    return () => clearTimeout(timer);
  }, [birthData, physicalDesc, lifeEvents]);

  useEffect(() => {
    const progress = calculateProgress(birthData, physicalDesc, lifeEvents);
    setOverallProgress(progress.percentage);
  }, [birthData, physicalDesc, lifeEvents]);

  useEffect(() => {
    const loadFormData = () => {
      try {
        const saved_birth = localStorage.getItem(STORAGE_KEYS.BIRTH_DATA);
        if (saved_birth) setBirthData(JSON.parse(saved_birth));
        const saved_physical = localStorage.getItem(STORAGE_KEYS.PHYSICAL_DATA);
        if (saved_physical) setPhysicalDesc(JSON.parse(saved_physical));
        const saved_events = localStorage.getItem(STORAGE_KEYS.EVENTS_DATA);
        if (saved_events) setLifeEvents(JSON.parse(saved_events));
        const timestamp = localStorage.getItem(STORAGE_KEYS.FORM_TIMESTAMP);
        if (timestamp) setLastSaved(new Date(timestamp));
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    };
    loadFormData();
  }, []);

  useEffect(() => {
    const processPending = async () => {
      if (!isSignedIn || !isLoaded) return;
      const pending = localStorage.getItem(STORAGE_KEYS.PENDING_ANALYSIS);
      if (pending) {
        setShowAuthLoading(true);
        try {
          const data = JSON.parse(pending);
          await processAnalysis(data);
          localStorage.removeItem(STORAGE_KEYS.PENDING_ANALYSIS);
          router.replace('/rectify', { scroll: false });
        } catch (error) {
          console.error('Error processing pending analysis:', error);
          setShowAuthLoading(false);
        }
      }
    };
    processPending();
  }, [isSignedIn, isLoaded, router]);

  const processAnalysis = async (data: any) => {
    setIsProcessing(true);
    setStep(4);
    setShowAuthLoading(false);
    try {
      const transformedData = transformBirthDataForAPI(data);
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
      if (isSignedIn && user) {
        await saveToDatabase(resultData.result, transformedData);
      }
      clearFormData();
    } catch (error) {
      console.error('Analysis error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const transformBirthDataForAPI = (data: any) => {
    const { birthData, physicalDescription, lifeEvents } = data;
    if (!birthData?.dateOfBirth || !birthData?.tentativeTime) {
      throw new Error('Date of birth and tentative time are required.');
    }
    const dateTimeISO = combineDateTimeToISO(birthData.dateOfBirth, birthData.tentativeTime);
    if (!dateTimeISO) {
      throw new Error('Invalid date/time combination.');
    }
    return {
      birthData: { ...birthData, date: dateTimeISO },
      physicalDescription: physicalDescription || {},
      lifeEvents: lifeEvents || []
    };
  };

  const saveToDatabase = async (result: RectificationResult, formData: any) => {
    try {
      await fetch('/api/save-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, ...formData, result })
      });
    } catch (error) {
      console.error('DB save error:', error);
    }
  };

  const clearFormData = () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  };

  const handleSubmit = async () => {
    setValidationErrors([]);
    const validation = validateFormSubmission(birthData, physicalDesc, lifeEvents);
    if (!validation.isValid) {
      setValidationErrors(validation.errors.map(e => e.message));
      alert('Please fix errors: \n' + validation.errors.map(e => e.message).join('\n'));
      return;
    }
    const analysisData = { birthData, physicalDescription: physicalDesc, lifeEvents };
    localStorage.setItem(STORAGE_KEYS.PENDING_ANALYSIS, JSON.stringify(analysisData));
    if (isSignedIn) {
      await processAnalysis(analysisData);
    } else {
      // Let SignUpButton handle redirect
    }
  };

  const canProceed = () => {
    if (step === 1) return birthData.fullName && birthData.dateOfBirth && birthData.tentativeTime && birthData.timeUncertainty && birthData.birthPlace && birthData.gender && birthData.timezone;
    if (step === 3) return lifeEvents.length >= 3;
    return true;
  };

  const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
  const handlePrevious = () => setStep(prev => Math.max(prev - 1, 1));

  const renderStep = () => {
     const variants = { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -50 } };
     switch (step) {
      case 1: return <motion.div key="s1" variants={variants} initial="initial" animate="animate" exit="exit"><BirthDataForm birthData={birthData} setBirthData={setBirthData} /></motion.div>;
      case 2: return <motion.div key="s2" variants={variants} initial="initial" animate="animate" exit="exit"><PhysicalTraitsForm physicalDesc={physicalDesc} setPhysicalDesc={setPhysicalDesc} /></motion.div>;
      case 3: return <motion.div key="s3" variants={variants} initial="initial" animate="animate" exit="exit"><LifeEventsForm lifeEvents={lifeEvents} setLifeEvents={setLifeEvents} /></motion.div>;
      case 4: return isProcessing ? <RealTimeDisplay onComplete={() => setIsProcessing(false)} /> : (result ? <ResultsDisplay result={result} /> : <div>Something went wrong.</div>);
      default: return null;
    }
  };

  if (showAuthLoading) return <div>Loading...</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <header className="py-6 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6">
            <h1 className="text-3xl font-bold">Birth Time Rectification</h1>
            <p className="text-white/70">Find your precise birth time.</p>
            {step < 4 && <StepIndicator currentStep={step} totalSteps={4} />}
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
        
        {step < 4 && (
          <div className="flex justify-between mt-10 max-w-4xl mx-auto">
            {step > 1 ? <button onClick={handlePrevious} className="px-6 py-3 bg-white/10 rounded-xl">Back</button> : <div/>}
            {step < 3 ? (
              <button onClick={handleNext} disabled={!canProceed()} className="px-6 py-3 bg-amber-500 rounded-xl disabled:opacity-50">Next</button>
            ) : (
                <div onClick={handleSubmit}>
                  <SignUpButton mode="redirect" redirectUrl="/rectify">
                      <button disabled={!canProceed()} className="px-8 py-3 bg-amber-500 rounded-xl disabled:opacity-50">Find My Birth Time</button>
                  </SignUpButton>
                </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
