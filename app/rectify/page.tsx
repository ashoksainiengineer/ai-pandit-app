/**
 * Birth Time Rectification Page - GOD TIER ROBUST VERSION
 * Sacred Ivory Light Theme - Bulletproof form flow with step guards
 */

'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { APIClient } from '@/lib/api-client';
import { BirthData, LifeEvent, PhysicalTraits, TimeOffsetConfig, SpouseData, ForensicTraits } from '@/lib/types';
import { Gender } from '@/lib/forensic-emojis';
import Step1BirthDetails from '@/components/rectify/Step1BirthDetails';
import Step3LifeEvents from '@/components/rectify/Step3LifeEvents';
import Step2ForensicTraits from '@/components/rectify/Step2ForensicTraits';
import Step3PhysicalTraits from '@/components/rectify/Step3PhysicalTraits';
import Step4Review from '@/components/rectify/Step4Review';
import Layout from '@/components/Layout';
import { debounce } from '@/lib/debounce';
import AnalysisErrorBoundary from '@/components/rectify/AnalysisErrorBoundary';
import { useWarmup } from '@/hooks/use-warmup';
import { env } from '@/lib/config';

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
    const { getToken, userId } = useAuth();
    const [draftSessionId, setDraftSessionId] = useState<string | null>(null);
    const [cloudSaveStatus, setCloudSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [lastSavedData, setLastSavedData] = useState<string>('');
    const [draftLoaded, setDraftLoaded] = useState(false);

    // 🔥 WAKE UP ENGINE: Pre-warm Hugging Face backends
    useWarmup();

    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [maxUnlockedStep, setMaxUnlockedStep] = useState(1);

    // Clear draft if ?new=true
    useEffect(() => {
        if (isNewPerson) {
            localStorage.removeItem('btr_draft_id');
            setDraftSessionId(null);
            setBirthData(initialBirthData);
            setLifeEvents([]);
            setForensicTraits(initialForensicTraits);
            setSpouseData(initialSpouseData);
            setDraftLoaded(true);
        }
    }, [isNewPerson]);

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

        // Deep Dive Check: Ensure events have dates
        const invalidEvents = lifeEvents.filter(e => !e.eventDate || e.eventDate.trim() === '');
        if (invalidEvents.length > 0) {
            errors.push(`Please set dates for ${invalidEvents.length} event(s).`);
        }

        return { isValid: errors.length === 0, errors, warnings: [], progress: lifeEvents.length >= 3 ? 100 : Math.round((lifeEvents.length / 3) * 100) };
    }, [lifeEvents]);

    const validateAllSteps = useCallback((): { isValid: boolean; errors: string[] } => {
        const allErrors: string[] = [];
        if (!validateStep1().isValid) allErrors.push('Step 1 is incomplete.');
        if (!validateStep3().isValid) allErrors.push('Life Events are incomplete.');
        return { isValid: allErrors.length === 0, errors: allErrors };
    }, [validateStep1, validateStep3]);

    const handleNext = useCallback(() => {
        if (isSubmitting) return;

        // Validation per step
        if (step === 1) {
            const v = validateStep1();
            if (!v.isValid) { setError(v.errors.join(', ')); return; }
        } else if (step === 4) {
            const v = validateStep3();
            if (!v.isValid) { setError(v.errors.join(', ')); return; }
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
            const backendUrl = env.api.backendUrl.replace(/\/$/, '');

            const payload = {
                birthData,
                lifeEvents,
                forensicTraits,
                spouseData,
                offsetConfig,
                consentConfirmed: true
            };

            let result;
            if (draftSessionId) {
                // 1. Force save to Vercel (same Turso DB) to ensure latest data is persisted
                await fetch(`/api/sessions/${draftSessionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ birthData, lifeEvents, forensicTraits, spouseData, offsetConfig })
                });

                // 2. Trigger Requeue on HF Backend (reads from same Turso DB)
                result = await APIClient.post(`${backendUrl}/api/queue/requeue`, { sessionId: draftSessionId }, getToken);
            } else {
                // 3. Normal Calculate - Submit to HF Backend Queue
                result = await APIClient.post(`${backendUrl}/api/queue`, payload, getToken);
            }
            localStorage.removeItem('btr_draft_id');

            // Navigate to analysis page (requeue returns sessionId in data)
            const sessionId = result.data?.sessionId || result.sessionId || draftSessionId;
            router.push(`/rectify/${sessionId}`);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
            setIsSubmitting(false);
        }
    };

    // Wrapper functions for child components
    const updateBirthData = useCallback((updates: Partial<BirthData>) => {
        setBirthData(prev => ({ ...prev, ...updates }));
    }, []);

    const updateForensicTraits = useCallback((updates: Partial<ForensicTraits>) => {
        setForensicTraits(prev => ({ ...prev, ...updates }));
    }, []);

    const updateSpouseData = useCallback((updates: Partial<SpouseData>) => {
        setSpouseData(prev => ({ ...prev, ...updates }));
    }, []);

    const handleBack = useCallback(() => {
        if (step > 1) {
            setStep(step - 1);
            setError(null);
            window.scrollTo(0, 0);
        }
    }, [step]);

    // Loading state - wait for draft to load if applicable
    useEffect(() => {
        if (isNewPerson) {
            setIsLoading(false);
            setDraftLoaded(true);
            return;
        }
        // If not new person and no draft will be loaded, set loaded immediately
        const savedDraftId = draftIdFromUrl || localStorage.getItem('btr_draft_id');
        if (!savedDraftId) {
            setDraftLoaded(true);
        }
        const timer = setTimeout(() => setIsLoading(false), 100);
        return () => clearTimeout(timer);
    }, [isNewPerson, draftIdFromUrl]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // AUTO-SAVE: Save draft to database every 5 seconds when data changes
    // ═══════════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        // Only save if user has entered meaningful data (at least name)
        if (!birthData.fullName || birthData.fullName.trim().length < 2) return;
        if (!userId) return; // Must be logged in

        const currentData = JSON.stringify({ birthData, lifeEvents, forensicTraits, spouseData, offsetConfig });

        // Don't save if data hasn't changed from last save
        if (currentData === lastSavedData) return;

        const saveDraft = async () => {
            setCloudSaveStatus('saving');
            try {
                const token = await getToken();
                const payload = { birthData, lifeEvents, forensicTraits, spouseData, offsetConfig };

                // Hybrid Architecture: Save drafts to Vercel (Local API) for speed
                if (!draftSessionId) {
                    const createRes = await fetch(`/api/sessions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(payload)
                    });
                    if (createRes.ok) {
                        const result = await createRes.json();
                        setDraftSessionId(result.data.id);
                        localStorage.setItem('btr_draft_id', result.data.id);
                    }
                } else {
                    // Update existing draft via local API
                    // Note: Use PUT /api/sessions/[id] for updates
                    await fetch(`/api/sessions/${draftSessionId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(payload)
                    });
                }

                setLastSavedData(currentData);
                setCloudSaveStatus('saved');
                setTimeout(() => setCloudSaveStatus('idle'), 2000);
            } catch (err) {
                console.error('Auto-save failed:', err);
                setCloudSaveStatus('error');
            }
        };

        // 5 second debounce - save after user stops typing for 5 seconds
        const timer = setTimeout(saveDraft, 5000);
        return () => clearTimeout(timer);
    }, [birthData, lifeEvents, forensicTraits, spouseData, offsetConfig, draftSessionId, userId, getToken, lastSavedData]);

    // Load existing draft on mount
    useEffect(() => {
        const loadDraft = async () => {
            // Priority: URL param > localStorage
            const savedDraftId = draftIdFromUrl || localStorage.getItem('btr_draft_id');
            if (!savedDraftId) {
                // No draft to load - mark as loaded immediately
                setDraftLoaded(true);
                return;
            }

            try {
                const token = await getToken();

                // Hybrid Architecture: Load drafts from Vercel (Local API) for speed
                const res = await fetch(`/api/sessions/${savedDraftId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const result = await res.json();
                    if (result.success && result.data) {
                        const session = result.data;

                        setDraftSessionId(savedDraftId);
                        localStorage.setItem('btr_draft_id', savedDraftId);
                        
                        if (session.birthData) setBirthData(session.birthData);
                        if (session.lifeEvents && Array.isArray(session.lifeEvents)) setLifeEvents(session.lifeEvents);
                        if (session.forensicTraits) setForensicTraits(session.forensicTraits);
                        if (session.spouseData) setSpouseData(session.spouseData);

                        if (session.offsetConfig) {
                            setOffsetConfig(typeof session.offsetConfig === 'string'
                                ? JSON.parse(session.offsetConfig)
                                : session.offsetConfig);
                        }

                        setLastSavedData(JSON.stringify({
                            birthData: session.birthData,
                            lifeEvents: session.lifeEvents,
                            forensicTraits: session.forensicTraits,
                            spouseData: session.spouseData,
                            offsetConfig: session.offsetConfig
                        }));
                        
                        setDraftLoaded(true);
                        console.log('✅ Draft loaded successfully:', savedDraftId);
                    }
                }
            } catch (err) {
                console.error('Failed to load draft:', err);
                setDraftLoaded(true); // Still mark as loaded to prevent infinite loading
            }
        };

        // Only load if not a new person
        if (!isNewPerson) {
            loadDraft();
        }
    }, [getToken, draftIdFromUrl, isNewPerson]);

    if (isLoading || (!isNewPerson && !draftLoaded)) {
        return <RectifyPageSkeleton />;
    }

    return (
        <Layout hideFooter>
            <AnalysisErrorBoundary>
                {/* Auto-save Status Indicator */}
                <div className="fixed top-20 right-4 z-50">
                    {cloudSaveStatus === 'saving' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium shadow-sm border border-blue-100">
                            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </div>
                    )}
                    {cloudSaveStatus === 'saved' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-medium shadow-sm border border-green-100">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Saved
                        </div>
                    )}
                    {cloudSaveStatus === 'error' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-medium shadow-sm border border-red-100">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Save failed
                        </div>
                    )}
                </div>

                {/* The rest of the JSX content */}
                <div className="pt-28 pb-16">
                    {/* Progress Indicator and other UI elements */}
                    <div className="min-h-[400px]">
                        {step === 1 && <Step1BirthDetails data={birthData} updateData={updateBirthData} offsetConfig={offsetConfig} updateOffset={setOffsetConfig} spouseData={spouseData} updateSpouse={updateSpouseData} />}
                        {step === 2 && <Step3PhysicalTraits physicalTraits={forensicTraits.physical} updateTraits={(p) => updateForensicTraits({ physical: { ...forensicTraits.physical, ...p } })} />}
                        {step === 3 && <Step2ForensicTraits traits={forensicTraits} updateTraits={updateForensicTraits} gender={birthData.gender as Gender} onNext={handleNext} />}
                        {step === 4 && <Step3LifeEvents lifeEvents={lifeEvents} updateEvents={setLifeEvents} offsetConfig={offsetConfig} />}
                        {step === 5 && <Step4Review data={birthData} events={lifeEvents} traits={forensicTraits.physical} forensicTraits={forensicTraits} onSubmit={handleSubmit} isSubmitting={isSubmitting} onEdit={setStep} offsetConfig={offsetConfig} />}
                    </div>
                    <div className="flex justify-between items-center mt-12 pt-6 border-t border-[#F0E8DE]">
                        <button onClick={handleBack} disabled={step === 1} className={`px-6 py-3 rounded-xl font-semibold transition-colors ${step === 1 ? 'opacity-0' : 'border-2 border-[#B8860B]/50 text-[#B8860B] hover:bg-[#B8860B]/10'}`}>← Back</button>
                        {step < 5 && <button onClick={handleNext} className="px-8 py-3 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white rounded-xl font-semibold hover:shadow-lg transition-all">Next Step →</button>}
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
