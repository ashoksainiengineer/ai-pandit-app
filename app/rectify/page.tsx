/**
 * Birth Time Rectification Page - GOD TIER ROBUST VERSION
 * Sacred Ivory Light Theme - Bulletproof form flow with step guards
 */

'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { BirthData, LifeEvent, PhysicalTraits, TimeOffsetConfig, SpouseData, ForensicTraits } from '@/lib/types';
import { Gender } from '@/lib/forensic-emojis';
import Step1BirthDetails from '@/components/rectify/Step1BirthDetails';
import Step3LifeEvents from '@/components/rectify/Step3LifeEvents';
import Step2ForensicTraits from '@/components/rectify/Step2ForensicTraits';
import Step4Review from '@/components/rectify/Step4Review';
import Layout from '@/components/Layout';
import { debounce } from '@/lib/debounce';
import AnalysisErrorBoundary from '@/components/rectify/AnalysisErrorBoundary';

// Initial States
const initialBirthData: BirthData = {
    fullName: '',
    dateOfBirth: '',
    tentativeTime: '',
    birthPlace: '',
    latitude: 0,
    longitude: 0,
    timezone: 5.5,
    gender: 'male'
};

const initialForensicTraits: ForensicTraits = {
    physical: {
        facialStructure: { forehead: '', eyeShape: '', noseType: '', teethAlignment: '', voicePitch: '' },
        skinHair: { texture: '', hairType: '', complexion: '', marks: [] },
        build: '',
        height: { cm: 0, feet: 0, inches: 0 }
    },
    psychographic: {
        speechStyle: '',
        decisionMaking: '',
        stressResponse: '',
        sleepCycle: '',
        temperament: ''
    },
    biological: {
        prakriti: '',
        sensitivity: { heat: '', cold: '' },
        recurringHealthIssues: []
    },
    family: {
        siblingPosition: '',
        brotherCount: 0,
        sisterCount: 0,
        fatherStatusAtBirth: '',
        motherHealthAtBirth: ''
    }
};

const initialSpouseData: SpouseData = {
    dateOfBirth: '',
    birthTime: '',
    latitude: 0,
    longitude: 0,
    timezone: 5.5
};

// Step Validation Types
type StepValidation = {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    progress: number; // 0-100
};

type StepStatus = 'locked' | 'unlocked' | 'current' | 'completed';

// Loading skeleton for Suspense
function RectifyPageSkeleton() {
    return (
        <Layout hideFooter>
            <div className="pt-28 pb-16">
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-[#7A756F]">Loading saved draft...</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// Inner component that uses useSearchParams
function RectifyPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isNewPerson = searchParams.get('new') === 'true';
    const draftIdFromUrl = searchParams.get('draft_id');
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [birthData, setBirthData] = useState<BirthData>(initialBirthData);
    const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
    const [forensicTraits, setForensicTraits] = useState<ForensicTraits>(initialForensicTraits);
    const [spouseData, setSpouseData] = useState<SpouseData>(initialSpouseData);
    const [offsetConfig, setOffsetConfig] = useState<TimeOffsetConfig>({ preset: '1hour', customMinutes: 60, description: '±1 hour' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuth();
    const [draftSessionId, setDraftSessionId] = useState<string | null>(null);
    const [cloudSaveStatus, setCloudSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [maxUnlockedStep, setMaxUnlockedStep] = useState(1);

    const validateStep1 = useCallback((): StepValidation => {
        const errors: string[] = [];
        let filledFields = 0;
        const totalFields = 5;

        if (birthData.fullName?.trim().length < 2) errors.push("Full Name must be at least 2 characters"); else filledFields++;
        if (!birthData.dateOfBirth) errors.push("Date of Birth is required"); else filledFields++;
        if (!birthData.tentativeTime) errors.push("Tentative Birth Time is required"); else filledFields++;
        if (!birthData.birthPlace?.trim()) errors.push("Birth Place is required"); else filledFields++;
        if (!birthData.gender) errors.push("Gender is required"); else filledFields++;

        return { isValid: errors.length === 0, errors, warnings: [], progress: Math.round((filledFields / totalFields) * 100) };
    }, [birthData]);

    const validateStep3 = useCallback((): StepValidation => {
        const errors: string[] = [];
        if (lifeEvents.length < 3) errors.push(`Minimum 3 life events required. Currently: ${lifeEvents.length}`);
        return { isValid: errors.length === 0, errors, warnings: [], progress: lifeEvents.length >= 3 ? 100 : Math.round((lifeEvents.length / 3) * 100) };
    }, [lifeEvents]);

    const validateAllSteps = useCallback((): { isValid: boolean; errors: string[] } => {
        const allErrors: string[] = [];
        if (!validateStep1().isValid) allErrors.push('Step 1 is incomplete.');
        if (!validateStep3().isValid) allErrors.push('Step 3 is incomplete.');
        return { isValid: allErrors.length === 0, errors: allErrors };
    }, [validateStep1, validateStep3]);

    const handleNext = useCallback(() => {
        if (isSubmitting) return;
        const validation = step === 1 ? validateStep1() : validateStep3();
        if (!validation.isValid) {
            setError(validation.errors.join(', '));
            return;
        }
        setCompletedSteps(prev => new Set(prev).add(step));
        const nextStep = step + 1;
        setMaxUnlockedStep(prev => Math.max(prev, nextStep));
        setStep(nextStep);
        setError(null);
        window.scrollTo(0, 0);
    }, [step, isSubmitting, validateStep1, validateStep3]);

    const handleSubmit = async () => {
        const fullValidation = validateAllSteps();
        if (!fullValidation.isValid) {
            setError(fullValidation.errors.join('. '));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const token = await getToken();
            const payload = { birthData, lifeEvents, forensicTraits, spouseData, offsetConfig };

            const response = await fetch(`/api/sessions/${draftSessionId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const result = await response.json();
            localStorage.removeItem('btr_draft_id');
            router.push(`/rectify/${result.data.sessionId}/results`);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
            setIsSubmitting(false);
        }
    };

    // Other hooks and functions remain the same...
    // ...

    if (isLoading) {
        return <RectifyPageSkeleton />;
    }

    return (
        <Layout hideFooter>
            <AnalysisErrorBoundary>
                {/* The rest of the JSX content */}
                 <div className="pt-28 pb-16">
                    {/* Progress Indicator and other UI elements */}
                    <div className="min-h-[400px]">
                        {step === 1 && <Step1BirthDetails data={birthData} updateData={setBirthData} offsetConfig={offsetConfig} updateOffset={setOffsetConfig} spouseData={spouseData} updateSpouse={setSpouseData} />}
                        {step === 2 && <Step2ForensicTraits traits={forensicTraits} updateTraits={setForensicTraits} gender={birthData.gender as Gender} />}
                        {step === 3 && <Step3LifeEvents lifeEvents={lifeEvents} updateEvents={setLifeEvents} offsetConfig={offsetConfig} />}
                        {step === 4 && <Step4Review data={birthData} events={lifeEvents} forensicTraits={forensicTraits} onSubmit={handleSubmit} isSubmitting={isSubmitting} onEdit={setStep} offsetConfig={offsetConfig} />}
                    </div>
                    <div className="flex justify-between items-center mt-12 pt-6 border-t border-[#F0E8DE]">
                        <button onClick={handleBack} disabled={step === 1} className={`px-6 py-3 rounded-xl font-semibold transition-colors ${step === 1 ? 'opacity-0' : 'border-2 border-[#B8860B]/50 text-[#B8860B] hover:bg-[#B8860B]/10'}`}>← Back</button>
                        {step < 4 && <button onClick={handleNext} className="px-8 py-3 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white rounded-xl font-semibold hover:shadow-lg transition-all">Next Step →</button>}
                    </div>
                </div>
            </AnalysisErrorBoundary>
        </Layout>
    );
}

export default function RectifyPage() {
    return (
        <Suspense fallback={<RectifyPageSkeleton />}>
            <RectifyPageContent />
        </Suspense>
    );
}
