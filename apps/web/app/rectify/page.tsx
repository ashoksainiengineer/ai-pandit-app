/**
 * Birth Time Rectification Page - GOD TIER ROBUST VERSION
 * Sacred Ivory Light Theme - Bulletproof form flow with step guards
 * 
 * Performance: Lazy loaded step components for faster initial load
 * Autosave: Robust with retry, localStorage backup, and offline support
 */

'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef, useMemo, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { APIClient } from '@/lib/api-client';
import { BirthData, LifeEvent, PhysicalTraits, TimeOffsetConfig, SpouseData, ForensicTraits } from '@/lib/types';
import { Gender } from '@/lib/forensic-emojis';
import Layout from '@/components/Layout';
import AnalysisErrorBoundary from '@/components/rectify/AnalysisErrorBoundary';
import { useWarmup } from '@/hooks/use-warmup';
import { env } from '@/lib/config';
import { waitForAnalysisSessionReady } from '@/lib/analysis-session-readiness';
import dynamic from 'next/dynamic';

// Lazy load step components for faster initial load
const Step1BirthDetails = dynamic(() => import('@/components/rectify/Step1BirthDetails'), {
    loading: () => <div className="animate-pulse bg-[#F5F0E8] h-96 rounded-xl" />,
    ssr: false
});
const Step3PhysicalTraits = dynamic(() => import('@/components/rectify/Step3PhysicalTraits'), {
    loading: () => <div className="animate-pulse bg-[#F5F0E8] h-96 rounded-xl" />,
    ssr: false
});
const Step2ForensicTraits = dynamic(() => import('@/components/rectify/Step2ForensicTraits'), {
    loading: () => <div className="animate-pulse bg-[#F5F0E8] h-96 rounded-xl" />,
    ssr: false
});
const Step3LifeEvents = dynamic(() => import('@/components/rectify/Step3LifeEvents'), {
    loading: () => <div className="animate-pulse bg-[#F5F0E8] h-96 rounded-xl" />,
    ssr: false
});
const Step4Review = dynamic(() => import('@/components/rectify/Step4Review'), {
    loading: () => <div className="animate-pulse bg-[#F5F0E8] h-96 rounded-xl" />,
    ssr: false
});

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

const FRONTEND_MUTABLE_SESSION_STATUSES = new Set(['draft', 'failed', 'pending']);

function canMutateSessionInForm(status: unknown): boolean {
    return typeof status === 'string' && FRONTEND_MUTABLE_SESSION_STATUSES.has(status);
}

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

    const toErrorMessage = useCallback((value: unknown, fallback: string): string => {
        if (typeof value === 'string' && value.trim()) return value;
        if (value instanceof Error && value.message.trim()) return value.message;
        if (value && typeof value === 'object') {
            const asRecord = value as { message?: unknown; error?: unknown };
            if (typeof asRecord.message === 'string' && asRecord.message.trim()) return asRecord.message;
            if (typeof asRecord.error === 'string' && asRecord.error.trim()) return asRecord.error;
            if (asRecord.error && typeof asRecord.error === 'object') {
                const nestedMessage = (asRecord.error as { message?: unknown }).message;
                if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage;
            }
        }
        return fallback;
    }, []);

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

    const handleSubmit = useCallback(async () => {
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
                const updateRes = await fetch(`/api/sessions/${draftSessionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ birthData, lifeEvents, forensicTraits, spouseData, offsetConfig })
                });
                // Session can become locked between load and submit; requeue still handles it safely.
                if (!updateRes.ok && updateRes.status !== 409) {
                    let updateError = 'Failed to save latest draft';
                    try {
                        const updateJson = await updateRes.json();
                        updateError = toErrorMessage(updateJson?.error, updateError);
                    } catch {
                        // Keep default error if response body is not JSON.
                    }
                    throw new Error(updateError);
                }

                // 2. Trigger Requeue on HF Backend (reads from same Turso DB)
                result = await APIClient.post(`${backendUrl}/api/queue/requeue`, { sessionId: draftSessionId }, getToken);
            } else {
                // 3. Normal Calculate - Submit to HF Backend Queue
                result = await APIClient.post(`${backendUrl}/api/queue`, payload, getToken);
            }

            if (!result?.success) {
                throw new Error(toErrorMessage(result?.error, 'Failed to start analysis'));
            }
            localStorage.removeItem('btr_draft_id');

            // Navigate to analysis page (requeue returns sessionId in data)
            const sessionId = result.data?.sessionId || result.sessionId || draftSessionId;
            if (!sessionId) {
                throw new Error('Analysis session ID was not returned');
            }

            const isReady = await waitForAnalysisSessionReady(backendUrl, sessionId, getToken);
            if (!isReady) {
                throw new Error('Analysis session is still initializing. Please try again in a few seconds.');
            }

            router.push(`/rectify/${sessionId}`);

        } catch (err: any) {
            setError(toErrorMessage(err, 'An unexpected error occurred. Please try again.'));
            setIsSubmitting(false);
        }
    }, [toErrorMessage, validateAllSteps, getToken, draftSessionId, birthData, lifeEvents, forensicTraits, spouseData, offsetConfig, router]);

    // Wrapper functions for child components
    const updateBirthData = useCallback((updates: Partial<BirthData>) => {
        setBirthData(prev => ({ ...prev, ...updates }));
    }, []);

    const updateForensicTraits = useCallback((updates: Partial<ForensicTraits>) => {
        setForensicTraits(prev => ({
            ...prev,
            ...updates,
            physical: { ...prev.physical, ...updates.physical },
            biological: { ...prev.biological, ...updates.biological },
            psychographic: { ...prev.psychographic, ...updates.psychographic },
            family: { ...prev.family, ...updates.family }
        }));
    }, []);

    const updateSpouseData = useCallback((updates: Partial<SpouseData>) => {
        setSpouseData(prev => ({ ...prev, ...updates }));
    }, []);

    const updatePhysicalTraits = useCallback((p: any) => {
        updateForensicTraits({ physical: { ...forensicTraits.physical, ...p } });
    }, [forensicTraits.physical, updateForensicTraits]);

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
    // ROBUST AUTO-SAVE: With retry, localStorage backup, and offline support
    // ═══════════════════════════════════════════════════════════════════════════════
    const saveRetryCount = useRef(0);
    const lastSaveAttemptRef = useRef<string>('');
    const pendingSaveRef = useRef<NodeJS.Timeout | null>(null);

    // Save to localStorage as backup (immediate, always)
    const saveToLocalStorage = useCallback((data: {
        birthData: BirthData;
        lifeEvents: LifeEvent[];
        forensicTraits: ForensicTraits;
        spouseData: SpouseData;
        offsetConfig: TimeOffsetConfig;
    }) => {
        try {
            localStorage.setItem('btr_local_backup', JSON.stringify({
                ...data,
                savedAt: new Date().toISOString()
            }));
        } catch (e) {
            console.warn('localStorage save failed:', e);
        }
    }, []);

    const currentDataString = useMemo(() => 
        JSON.stringify({ birthData, lifeEvents, forensicTraits, spouseData, offsetConfig }),
        [birthData, lifeEvents, forensicTraits, spouseData, offsetConfig]
    );

    // Main autosave with retry logic
    useEffect(() => {
        // Only save if user has entered meaningful data
        if (!birthData.fullName || birthData.fullName.trim().length < 2) return;
        if (!userId) return;
        
        // Skip if nothing changed
        if (currentDataString === lastSavedData) return;

        // Immediate localStorage backup
        saveToLocalStorage({ birthData, lifeEvents, forensicTraits, spouseData, offsetConfig });

        // Clear pending save
        if (pendingSaveRef.current) {
            clearTimeout(pendingSaveRef.current);
        }

        const saveDraft = async (retryCount = 0): Promise<boolean> => {
            // Prevent duplicate save attempts
            if (lastSaveAttemptRef.current === currentDataString && retryCount === 0) {
                return false;
            }
            lastSaveAttemptRef.current = currentDataString;

            setCloudSaveStatus('saving');

            try {
                const token = await getToken();
                const payload = { birthData, lifeEvents, forensicTraits, spouseData, offsetConfig };

                let success = false;

                if (!draftSessionId) {
                    // Create new session
                    const createRes = await fetch(`/api/sessions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(payload)
                    });
                    if (createRes.ok) {
                        const result = await createRes.json();
                        setDraftSessionId(result.data.id);
                        localStorage.setItem('btr_draft_id', result.data.id);
                        success = true;
                    }
                } else {
                    // Update existing
                    const updateRes = await fetch(`/api/sessions/${draftSessionId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(payload)
                    });

                    // Existing draft became locked (typically stale completed/processing ID in localStorage).
                    // Drop stale draft reference so next autosave creates a fresh editable draft.
                    if (updateRes.status === 409) {
                        setDraftSessionId(null);
                        localStorage.removeItem('btr_draft_id');
                        return true;
                    }

                    success = updateRes.ok;
                }

                if (success) {
                    setLastSavedData(currentDataString);
                    setCloudSaveStatus('saved');
                    saveRetryCount.current = 0;
                    setTimeout(() => setCloudSaveStatus('idle'), 2000);
                    return true;
                } else {
                    throw new Error('Save failed');
                }
            } catch (err) {
                console.error(`Auto-save failed (attempt ${retryCount + 1}):`, err);
                
                // Retry logic: 3 attempts with exponential backoff
                if (retryCount < 3) {
                    const backoffMs = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                    await new Promise(resolve => setTimeout(resolve, backoffMs));
                    return saveDraft(retryCount + 1);
                } else {
                    setCloudSaveStatus('error');
                    setTimeout(() => setCloudSaveStatus('idle'), 3000);
                    return false;
                }
            }
        };

        // Debounce: Save after 3 seconds of inactivity
        pendingSaveRef.current = setTimeout(() => {
            saveDraft();
        }, 3000);

        return () => {
            if (pendingSaveRef.current) {
                clearTimeout(pendingSaveRef.current);
            }
        };
    }, [currentDataString, draftSessionId, userId, getToken, lastSavedData, saveToLocalStorage]); // eslint-disable-line react-hooks/exhaustive-deps -- Using memoized currentDataString instead of individual deps

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
                        const canMutateLoadedSession = canMutateSessionInForm(session.status);

                        if (canMutateLoadedSession) {
                            setDraftSessionId(savedDraftId);
                            localStorage.setItem('btr_draft_id', savedDraftId);
                        } else {
                            // Keep loaded values for user convenience but don't autosave into locked session.
                            setDraftSessionId(null);
                            localStorage.removeItem('btr_draft_id');
                        }
                        
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
                        {step === 2 && <Step3PhysicalTraits physicalTraits={forensicTraits.physical} updateTraits={updatePhysicalTraits} />}
                        {step === 3 && <Step2ForensicTraits traits={forensicTraits} updateTraits={updateForensicTraits} gender={birthData.gender as Gender} onNext={handleNext} />}
                        {step === 4 && <Step3LifeEvents lifeEvents={lifeEvents} updateEvents={setLifeEvents} offsetConfig={offsetConfig} />}
                        {step === 5 && <Step4Review data={birthData} events={lifeEvents} traits={forensicTraits.physical} forensicTraits={forensicTraits} onSubmit={handleSubmit} isSubmitting={isSubmitting} onEdit={setStep} offsetConfig={offsetConfig} />}
                    </div>
                    <div className="flex justify-between items-center mt-12 pt-6 border-t border-[#F0E8DE]">
                        <button onClick={handleBack} disabled={step === 1} className={`px-6 py-3 rounded-xl font-semibold transition-colors ${step === 1 ? 'opacity-0' : 'border-2 border-[#B8860B]/50 text-[#B8860B] hover:bg-[#B8860B]/10'}`}>← Back</button>
                        {step < 5 && <button onClick={handleNext} className="px-8 py-3 bg-gradient-to-r from-[#B8860B] to-[#78611D] text-white rounded-xl font-semibold hover:shadow-lg transition-all">Next Step →</button>}
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
