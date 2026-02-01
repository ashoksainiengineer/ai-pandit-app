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
                        <p className="text-[#7A756F]">Loading form...</p>
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
    const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);

    // Track which steps have been completed
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [maxUnlockedStep, setMaxUnlockedStep] = useState(1);

    // ═══════════════════════════════════════════════════════════════════════════════
    // VALIDATION FUNCTIONS - GOD TIER ROBUSTNESS
    // ═══════════════════════════════════════════════════════════════════════════════

    const validateStep1 = useCallback((): StepValidation => {
        const errors: string[] = [];
        const warnings: string[] = [];
        let progress = 0;
        const totalFields = 5;
        let filledFields = 0;

        // Full Name
        if (!birthData.fullName?.trim()) {
            errors.push("Full Name is required");
        } else if (birthData.fullName.trim().length < 2) {
            errors.push("Full Name must be at least 2 characters");
        } else {
            filledFields++;
        }

        // Date of Birth
        if (!birthData.dateOfBirth) {
            errors.push("Date of Birth is required");
        } else {
            const dob = new Date(birthData.dateOfBirth);
            const now = new Date();
            if (dob > now) {
                errors.push("Date of Birth cannot be in the future");
            } else {
                filledFields++;
            }
        }

        // Tentative Time
        if (!birthData.tentativeTime) {
            errors.push("Tentative Birth Time is required");
        } else {
            filledFields++;
        }

        // Birth Place
        if (!birthData.birthPlace?.trim()) {
            errors.push("Birth Place is required");
        } else {
            filledFields++;
        }

        // Gender
        if (!birthData.gender) {
            errors.push("Gender is required");
        } else {
            filledFields++;
        }

        // Location validation
        if (birthData.latitude === 0 && birthData.longitude === 0) {
            warnings.push("Please select a valid location from search or map");
        }

        progress = Math.round((filledFields / totalFields) * 100);

        return { isValid: errors.length === 0, errors, warnings, progress };
    }, [birthData]);

    const validateStep2 = useCallback((): StepValidation => {
        const errors: string[] = [];
        const warnings: string[] = [];
        let progress = 0;

        const { physical, psychographic, biological, family } = forensicTraits;
        const requiredFields = [
            { value: physical?.facialStructure?.forehead, name: "Forehead Type" },
            { value: physical?.facialStructure?.eyeShape, name: "Eye Shape" },
            { value: physical?.facialStructure?.voicePitch, name: "Voice Texture" },
            { value: biological?.prakriti, name: "Body Constitution (Prakriti)" },
            { value: psychographic?.speechStyle, name: "Speech Style" },
            { value: psychographic?.decisionMaking, name: "Decision Making Style" },
            { value: psychographic?.temperament, name: "Temperament" },
            { value: family?.siblingPosition, name: "Sibling Order" },
            { value: family?.fatherStatusAtBirth, name: "Father's Status at Birth" },
        ];

        let filledFields = 0;
        requiredFields.forEach(field => {
            if (field.value) {
                filledFields++;
            } else {
                errors.push(`${field.name} is required`);
            }
        });

        progress = Math.round((filledFields / requiredFields.length) * 100);

        return { isValid: errors.length === 0, errors, warnings, progress };
    }, [forensicTraits]);

    const validateStep3 = useCallback((): StepValidation => {
        const errors: string[] = [];
        const warnings: string[] = [];
        let progress = 0;

        if (lifeEvents.length < 3) {
            errors.push(`Minimum 3 life events required. Currently: ${lifeEvents.length}`);
        }

        // Check for critical events (career, marriage, education, relocation)
        const criticalCategories = ['career', 'marriage', 'education', 'relocation'];
        const presentCategories = new Set(lifeEvents.map(e => e.category));
        const missingCritical = criticalCategories.filter(c => !presentCategories.has(c));

        if (missingCritical.length > 0) {
            warnings.push(`Consider adding events from: ${missingCritical.join(', ')}`);
        }

        progress = lifeEvents.length >= 3 ? 100 : Math.round((lifeEvents.length / 3) * 100);

        return { isValid: errors.length === 0, errors, warnings, progress };
    }, [lifeEvents]);

    const validateStep4 = useCallback((): StepValidation => {
        // Step 4 is review, always valid if we reach here
        return { isValid: true, errors: [], warnings: [], progress: 100 };
    }, []);

    const getStepValidation = useCallback((stepNum: number): StepValidation => {
        switch (stepNum) {
            case 1: return validateStep1();
            case 2: return validateStep2();
            case 3: return validateStep3();
            case 4: return validateStep4();
            default: return { isValid: false, errors: [], warnings: [], progress: 0 };
        }
    }, [validateStep1, validateStep2, validateStep3, validateStep4]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // STEP NAVIGATION - WITH GUARDS
    // ═══════════════════════════════════════════════════════════════════════════════

    const getStepStatus = useCallback((stepNum: number): StepStatus => {
        if (stepNum === step) return 'current';
        if (completedSteps.has(stepNum)) return 'completed';
        if (stepNum <= maxUnlockedStep) return 'unlocked';
        return 'locked';
    }, [step, completedSteps, maxUnlockedStep]);

    const canNavigateToStep = useCallback((targetStep: number): boolean => {
        // Can always go to previous steps
        if (targetStep < step) return true;
        // Can go to next step if current step is valid
        if (targetStep === step + 1) {
            const validation = getStepValidation(step);
            return validation.isValid;
        }
        // Can go to unlocked steps
        return targetStep <= maxUnlockedStep;
    }, [step, maxUnlockedStep, getStepValidation]);

    const handleStepClick = useCallback((targetStep: number) => {
        const status = getStepStatus(targetStep);
        
        if (status === 'locked') {
            setError(`Please complete Step ${targetStep - 1} first`);
            return;
        }

        // If going to a previous step, just navigate
        if (targetStep < step) {
            setStep(targetStep);
            setError(null);
            window.scrollTo(0, 0);
            return;
        }

        // Validate current step before moving forward
        const currentValidation = getStepValidation(step);
        if (!currentValidation.isValid && targetStep > step) {
            setError(currentValidation.errors[0]);
            return;
        }

        setStep(targetStep);
        setError(null);
        window.scrollTo(0, 0);
    }, [step, getStepStatus, getStepValidation]);

    const handleNext = useCallback(() => {
        if (isSubmitting) return;
        
        const validation = getStepValidation(step);
        
        if (!validation.isValid) {
            setError(validation.errors.join(', '));
            return;
        }

        // Mark current step as completed
        setCompletedSteps(prev => new Set([...prev, step]));
        
        // Unlock next step
        const nextStep = step + 1;
        setMaxUnlockedStep(prev => Math.max(prev, nextStep));
        
        setStep(nextStep);
        setError(null);
        window.scrollTo(0, 0);
    }, [step, isSubmitting, getStepValidation]);

    const handleBack = useCallback(() => {
        if (step > 1) {
            setStep(step - 1);
            setError(null);
            window.scrollTo(0, 0);
        }
    }, [step]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // AUTO-SAVE & DATA PERSISTENCE
    // ═══════════════════════════════════════════════════════════════════════════════

    // Track last saved data to prevent duplicate saves
    const [lastSavedDataHash, setLastSavedDataHash] = useState<string>('');
    
    const saveDraftToCloud = async () => {
        if (!birthData.fullName || birthData.fullName.trim().length < 2) return;
        
        // Create hash of current data
        const currentData = JSON.stringify({ birthData, lifeEvents, forensicTraits, spouseData, offsetConfig });
        
        // Don't save if data hasn't changed
        if (currentData === lastSavedDataHash) return;
        
        setCloudSaveStatus('saving');
        try {
            const res = await fetch('/api/drafts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    birthData,
                    lifeEvents,
                    forensicTraits,
                    spouseData: spouseData.dateOfBirth ? spouseData : undefined,
                    offsetConfig,
                    sessionId: draftSessionId,
                }),
            });
            const result = await res.json();
            if (result.success) {
                setDraftSessionId(result.sessionId);
                setLastSavedDataHash(currentData);
                setCloudSaveStatus('saved');
                localStorage.setItem('btr_draft_id', result.sessionId);
                setTimeout(() => setCloudSaveStatus('idle'), 2000);
            } else {
                setCloudSaveStatus('error');
            }
        } catch (err) {
            setCloudSaveStatus('error');
        }
    };

    useEffect(() => {
        if (!isAutoSaveEnabled || !birthData.fullName) return;
        // 5 second debounce - only save after user stops typing for 5 seconds
        const timer = setTimeout(() => saveDraftToCloud(), 5000);
        return () => clearTimeout(timer);
    }, [birthData, lifeEvents, forensicTraits, spouseData, offsetConfig, isAutoSaveEnabled, lastSavedDataHash]);

    // Load from local storage
    useEffect(() => {
        // If new person requested, clear localStorage
        if (isNewPerson) {
            localStorage.removeItem('btr_form_data');
            localStorage.removeItem('btr_draft_id');
            // Reset all states
            setBirthData(initialBirthData);
            setLifeEvents([]);
            setForensicTraits(initialForensicTraits);
            setSpouseData(initialSpouseData);
            setStep(1);
            setCompletedSteps(new Set());
            setMaxUnlockedStep(1);
            setDraftSessionId(null);
        }

        const pingWarmup = async () => {
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
                fetch(`${backendUrl}/api/warmup`).catch(() => { });
            } catch (e) { }
        };
        pingWarmup();

        const saved = localStorage.getItem('btr_form_data');
        if (saved && !isNewPerson) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.birthData) setBirthData(parsed.birthData);
                if (parsed.lifeEvents) setLifeEvents(parsed.lifeEvents);
                if (parsed.forensicTraits) {
                    const merged = {
                        ...initialForensicTraits,
                        ...parsed.forensicTraits,
                        physical: { ...initialForensicTraits.physical, ...parsed.forensicTraits.physical },
                        psychographic: { ...initialForensicTraits.psychographic, ...parsed.forensicTraits.psychographic },
                        biological: { ...initialForensicTraits.biological, ...parsed.forensicTraits.biological },
                        family: { ...initialForensicTraits.family, ...parsed.forensicTraits.family }
                    };
                    setForensicTraits(merged);
                }
                if (parsed.spouseData) setSpouseData(parsed.spouseData);
                if (parsed.offsetConfig) setOffsetConfig(parsed.offsetConfig);
                if (parsed.completedSteps) setCompletedSteps(new Set(parsed.completedSteps));
                if (parsed.maxUnlockedStep) setMaxUnlockedStep(parsed.maxUnlockedStep);
            } catch (e) {
                console.error('Failed to restore form data', e);
            }
        }
        setIsAutoSaveEnabled(true);
    }, [isNewPerson]);

    // Save to local storage
    useEffect(() => {
        const dataToSave = { 
            birthData, 
            lifeEvents, 
            forensicTraits, 
            offsetConfig, 
            step, 
            spouseData,
            completedSteps: Array.from(completedSteps),
            maxUnlockedStep
        };
        localStorage.setItem('btr_form_data', JSON.stringify(dataToSave));
    }, [birthData, lifeEvents, forensicTraits, spouseData, offsetConfig, step, completedSteps, maxUnlockedStep]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // SUBMIT ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════════════

    const validateAllSteps = useCallback((): { isValid: boolean; errors: string[] } => {
        const allErrors: string[] = [];
        
        const step1Val = validateStep1();
        const step2Val = validateStep2();
        const step3Val = validateStep3();

        if (!step1Val.isValid) allErrors.push(`Step 1: ${step1Val.errors[0]}`);
        if (!step2Val.isValid) allErrors.push(`Step 2: ${step2Val.errors[0]}`);
        if (!step3Val.isValid) allErrors.push(`Step 3: ${step3Val.errors[0]}`);

        return { isValid: allErrors.length === 0, errors: allErrors };
    }, [validateStep1, validateStep2, validateStep3]);

    const handleSubmit = async () => {
        // Full validation before submit
        const fullValidation = validateAllSteps();
        if (!fullValidation.isValid) {
            setError(fullValidation.errors.join('. '));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                birthData: {
                    fullName: birthData.fullName,
                    dateOfBirth: birthData.dateOfBirth,
                    tentativeTime: birthData.tentativeTime,
                    birthPlace: birthData.birthPlace,
                    latitude: birthData.latitude || 28.6,
                    longitude: birthData.longitude || 77.2,
                    timezone: birthData.timezone,
                    gender: birthData.gender
                },
                // Send COMPLETE life events data to AI
                lifeEvents: lifeEvents.map(e => ({
                    category: e.category,
                    eventType: e.eventType,
                    datePrecision: e.datePrecision,
                    eventDate: e.eventDate,
                    endDate: e.endDate,
                    eventTime: e.eventTime, // CRITICAL: Exact time for exact_date_time precision
                    description: e.description,
                    importance: e.importance
                })),
                offsetConfig,
                forensicTraits,
                spouseData: spouseData.dateOfBirth ? spouseData : undefined
            };

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
            const token = await getToken();

            const response = await fetch(`${backendUrl}/api/queue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                localStorage.removeItem('btr_form_data');
                router.push(`/rectify/${result.data.sessionId}`);
            } else {
                setError(result.error || 'Failed to submit analysis. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════════

    const stepLabels = ['Birth Details', 'Physical Traits', 'Life Events', 'Review & Submit'];
    const stepEmojis = ['👤', '🪞', '📅', '✅'];

    return (
        <Layout hideFooter>
            <div className="pt-28 pb-16">
                {/* Progress Indicator */}
                <div className="mb-12">
                    <div className="flex items-start justify-between w-full">
                        {[1, 2, 3, 4].map((s) => (
                            <React.Fragment key={s}>
                                <button
                                    onClick={() => handleStepClick(s)}
                                    className="relative z-10 flex flex-col items-center min-w-[80px] outline-none focus:outline-none"
                                >
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2 ${s < step
                                            ? 'bg-[#2D7A5C] border-[#2D7A5C] text-white'
                                            : s === step
                                                ? 'bg-white border-[#B8860B] text-[#B8860B] shadow-[0_0_15px_rgba(184,134,11,0.3)]'
                                                : 'bg-[#F5EFE7] border-[#EBE2D6] text-[#A8A39D]'
                                            }`}
                                    >
                                        {s < step ? '✓' : stepEmojis[s - 1]}
                                    </div>
                                    <span className={`text-xs mt-2 font-medium whitespace-nowrap ${s === step ? 'text-[#B8860B]' : 'text-[#A8A39D]'}`}>
                                        {stepLabels[s - 1]}
                                    </span>
                                </button>

                                {s < 4 && (
                                    <div className="flex-1 mt-5 mx-2 h-0.5 bg-[#EBE2D6] relative rounded">
                                        <div
                                            className={`absolute top-0 left-0 h-full bg-[#B8860B] transition-all duration-500 rounded ${s < step ? 'w-full' : 'w-0'}`}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-[#C65D3B]/10 border border-[#C65D3B]/30 rounded-xl text-[#C65D3B]">
                        ⚠️ {error}
                    </div>
                )}

                {/* Step Content */}
                <div className="min-h-[400px]">
                    {step === 1 && (
                        <Step1BirthDetails
                            data={birthData}
                            updateData={(updates) => setBirthData(prev => ({ ...prev, ...updates }))}
                            offsetConfig={offsetConfig}
                            updateOffset={setOffsetConfig}
                            spouseData={spouseData}
                            updateSpouse={(updates) => setSpouseData(prev => ({ ...prev, ...updates }))}
                        />
                    )}
                    {step === 2 && (
                        <Step2ForensicTraits
                            traits={forensicTraits}
                            updateTraits={(updates) => setForensicTraits(prev => ({ ...prev, ...updates }))}
                            gender={birthData.gender as Gender}
                        />
                    )}
                    {step === 3 && (
                        <Step3LifeEvents
                            lifeEvents={lifeEvents}
                            updateEvents={setLifeEvents}
                            offsetConfig={offsetConfig}
                        />
                    )}
                    {step === 4 && (
                        <Step4Review
                            data={birthData}
                            events={lifeEvents}
                            traits={{ height: { cm: 0, feet: 0, inches: 0 }, build: '', complexion: '', faceShape: '', eyeColor: '', hairColor: '', hairType: '', prakriti: '', noseType: '' }}
                            forensicTraits={forensicTraits}
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            onEdit={setStep}
                            offsetConfig={offsetConfig}
                        />
                    )}
                </div>

                {/* Navigation */}
                {step < 4 && (
                    <div className="flex justify-between items-center mt-12 pt-6 border-t border-[#F0E8DE]">
                            <button
                                onClick={handleBack}
                                disabled={step === 1}
                                className={`px-6 py-3 rounded-xl font-semibold transition-colors ${step === 1
                                    ? 'opacity-0 cursor-default'
                                    : 'border-2 border-[#B8860B]/50 text-[#B8860B] hover:bg-[#B8860B]/10'
                                    }`}
                            >
                                ← Back
                            </button>
    
                            {/* Auto-save Status Indicator */}
                            <div className="flex items-center gap-2 text-sm">
                                {cloudSaveStatus === 'saving' && (
                                    <span className="flex items-center gap-1.5 text-[#B8860B] animate-pulse">
                                        <div className="w-4 h-4 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </span>
                                )}
                                {cloudSaveStatus === 'saved' && (
                                    <span className="flex items-center gap-1.5 text-[#2D7A5C]">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Auto-saved
                                    </span>
                                )}
                                {cloudSaveStatus === 'error' && (
                                    <span className="flex items-center gap-1.5 text-[#C65D3B]">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Save failed
                                    </span>
                                )}
                            </div>
    
                            <button
                                onClick={handleNext}
                                className="px-8 py-3 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(184,134,11,0.4)] transition-all"
                            >
                                Next Step →
                            </button>
                        </div>
                )}
            </div>
        </Layout>
    );
}

// Main export with Suspense wrapper
export default function RectifyPage() {
    return (
        <Suspense fallback={<RectifyPageSkeleton />}>
            <RectifyPageContent />
        </Suspense>
    );
}
