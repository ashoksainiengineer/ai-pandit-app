'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { BirthData, LifeEvent, PhysicalTraits, SpouseData, ForensicTraits } from '@/lib/types';
import { env } from '@/lib/config';
import { useStreamStore } from '@/lib/store/stream-store';
import { waitForAnalysisSessionReady } from '@/lib/analysis-session-readiness';
import { logger } from '@/lib/secure-logger';

import Step1BirthDetails from '@/components/rectify/Step1BirthDetails';
import Step3LifeEvents from '@/components/rectify/Step3LifeEvents';
import Step2ForensicTraits from '@/components/rectify/Step2ForensicTraits';
import Step3PhysicalTraits from '@/components/rectify/Step3PhysicalTraits';
import Step4Review from '@/components/rectify/Step4Review';
import Layout from '@/components/Layout';

interface EditSessionClientProps {
    sessionId: string;
    initialData: {
        birthData: BirthData;
        lifeEvents: LifeEvent[];
        physicalTraits?: PhysicalTraits;
        forensicTraits?: ForensicTraits;
        spouseData?: SpouseData;
        offsetConfig?: any;
    };
}

export function EditSessionClient({ sessionId, initialData }: EditSessionClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const getInitialStep = () => {
        const urlStep = searchParams.get('step');
        if (urlStep) {
            const parsed = parseInt(urlStep, 10);
            if (parsed >= 1 && parsed <= 5) return parsed;
        }
        return 1;
    };

    const [step, setStep] = useState(getInitialStep);
    const [birthData, setBirthData] = useState<BirthData | null>(initialData.birthData);
    const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>(initialData.lifeEvents || []);
    const [physicalTraits, setPhysicalTraits] = useState<PhysicalTraits>(initialData.physicalTraits || {
        height: { cm: 165, feet: 5, inches: 5 },
        build: 'medium',
        complexion: 'medium',
        faceShape: 'oval',
        eyeColor: 'brown',
        hairColor: 'black'
    });
    const [offsetConfig, setOffsetConfig] = useState<any>(initialData.offsetConfig || { preset: '1hour', customMinutes: 60, description: '±1 hour' });
    const [forensicTraits, setForensicTraits] = useState<ForensicTraits>(initialData.forensicTraits || {
        physical: {
            facialStructure: { forehead: '', eyeShape: '', noseType: '', teethAlignment: '', voicePitch: '' },
            skinHair: { texture: '', hairType: '', complexion: '', marks: [] },
            build: '',
            height: { cm: 0, feet: 0, inches: 0 }
        },
        psychographic: { speechStyle: '', decisionMaking: '', stressResponse: '', sleepCycle: '', temperament: '' },
        biological: { prakriti: '', sensitivity: { heat: '', cold: '' }, recurringHealthIssues: [] },
        family: { siblingPosition: '', brotherCount: 0, sisterCount: 0, fatherStatusAtBirth: '', motherHealthAtBirth: '' }
    });
    const [spouseData, setSpouseData] = useState<SpouseData>(initialData.spouseData || {
        dateOfBirth: '',
        birthTime: '',
        latitude: 0,
        longitude: 0,
        timezone: 5.5
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const { getToken } = useAuth();

    const toErrorMessage = (value: unknown, fallback: string): string => {
        if (typeof value === 'string' && value.trim()) return value;
        if (value instanceof Error && value.message.trim()) return value.message;
        if (value && typeof value === 'object') {
            const candidate = (value as { message?: unknown; error?: unknown }).message
                ?? (value as { message?: unknown; error?: unknown }).error;
            if (typeof candidate === 'string' && candidate.trim()) return candidate;
        }
        return fallback;
    };

    const updateStep = (newStep: number) => {
        setStep(newStep);
        const urlParams = new URLSearchParams(searchParams.toString());
        urlParams.set('step', newStep.toString());
        router.replace(`/rectify/${sessionId}/edit?${urlParams.toString()}`, { scroll: false });
    };

    // Auto-save effect with debounce
    const [lastSavedData, setLastSavedData] = useState<string>(JSON.stringify(initialData));

    useEffect(() => {
        if (!birthData || !birthData.fullName || birthData.fullName.trim().length < 2) return;
        if (isSubmitting) return;

        const currentData = JSON.stringify({ birthData, lifeEvents, forensicTraits, spouseData, offsetConfig });
        if (currentData === lastSavedData) return;

        const saveDraft = async () => {
            setSavingStatus('saving');
            try {
                const token = await getToken();
                const saveRes = await fetch(`/api/sessions/${sessionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        birthData,
                        lifeEvents,
                        forensicTraits,
                        spouseData,
                        offsetConfig
                    })
                });

                if (saveRes.status === 409) {
                    setSavingStatus('idle');
                    return;
                }

                if (!saveRes.ok) {
                    throw new Error(`Save failed with status ${saveRes.status}`);
                }

                setLastSavedData(currentData);
                setSavingStatus('saved');
                setTimeout(() => setSavingStatus('idle'), 2000);
            } catch (err) {
                logger.error('Auto-save failed', err instanceof Error ? err : new Error(String(err)));
                setSavingStatus('error');
            }
        };

        const timer = setTimeout(saveDraft, 5000);
        return () => clearTimeout(timer);
    }, [birthData, lifeEvents, forensicTraits, spouseData, offsetConfig, sessionId, lastSavedData, getToken, isSubmitting]);

    const advanceToNextStep = () => {
        setError(null);
        if (validateStep(step)) {
            const newStep = step + 1;
            updateStep(newStep);
            window.scrollTo(0, 0);
        }
    };

    const goToPreviousStep = () => {
        setError(null);
        const newStep = step - 1;
        updateStep(newStep);
        window.scrollTo(0, 0);
    };

    const validateStep = (currentStep: number) => {
        if (!birthData) return false;
        switch (currentStep) {
            case 1:
                if (!birthData.fullName) { setError("Full Name is required"); return false; }
                if (!birthData.dateOfBirth) { setError("Date of Birth is required"); return false; }
                if (!birthData.tentativeTime) { setError("Birth Time is required"); return false; }
                if (!birthData.birthPlace) { setError("Birth Place is required"); return false; }
                return true;
            case 2:
                return true;
            case 3:
                return true;
            case 4:
                if (lifeEvents.length < 3) {
                    setError(`Please add at least 3 life events. Currently: ${lifeEvents.length}`);
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const submitEditedSession = async () => {
        if (!birthData) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const token = await getToken();

            const updateRes = await fetch(`/api/sessions/${sessionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    birthData,
                    lifeEvents,
                    forensicTraits,
                    spouseData,
                    offsetConfig
                })
            });

            // 409 means session is locked for direct edit; continue to requeue path.
            if (!updateRes.ok && updateRes.status !== 409) {
                let updateError = 'Failed to update session';
                try {
                    const updateResult = await updateRes.json();
                    updateError = toErrorMessage(updateResult?.error, updateError);
                } catch {
                    // Keep default fallback when non-JSON error body is returned.
                }
                setError(updateError);
                setIsSubmitting(false);
                return;
            }

            const backendUrl = env.api.backendUrl.replace(/\/$/, '');
            try {
                const requeueRes = await fetch('/api/analysis/requeue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ sessionId })
                });
                const requeueResult = await requeueRes.json();
                if (!requeueResult?.success) {
                    setError(toErrorMessage(requeueResult?.error, 'Failed to restart analysis'));
                    setIsSubmitting(false);
                    return;
                }

                const isReady = await waitForAnalysisSessionReady(backendUrl, sessionId, getToken);
                if (!isReady) {
                    setError('Analysis session is still initializing. Please retry in a few seconds.');
                    setIsSubmitting(false);
                    return;
                }
            } catch (err: any) {
                setError(toErrorMessage(err, 'Failed to restart analysis'));
                setIsSubmitting(false);
                return;
            }

            // CRITICAL: Clear stale Zustand store before navigating to analysis page.
            // Without this, localStorage-persisted state (isComplete, empty candidatesByStage)
            // from the previous analysis rehydrates and causes empty containers.
            useStreamStore.getState().clearStore();

            router.push(`/rectify/${sessionId}`);

        } catch (err: any) {
            setError(toErrorMessage(err, 'Network error'));
            setIsSubmitting(false);
        }
    };

    return (
        <Layout hideFooter>
            <main className="min-h-screen bg-[#f8f8f8] text-[#000000] pt-16">
                <nav className="sticky top-0 z-50 bg-[#f8f8f8]/90 backdrop-blur-xl border-b border-[rgba(0,0,0,0.08)]">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3 group">
                            <span className="font-medium text-xl text-[#000000] tracking-tight">AI Pandit</span>
                        </Link>
                        <div className="flex items-center gap-6">
                            <Link
                                href="/dashboard"
                                className="text-sm font-medium text-[#636363] hover:text-[#000000] transition-colors"
                            >
                                Dashboard
                            </Link>
                            <div className="flex items-center gap-2 text-sm">
                                {savingStatus === 'saving' && <span className="text-[#000000] animate-pulse">Saving...</span>}
                                {savingStatus === 'saved' && <span className="text-[#184131]">Saved ✓</span>}
                                {savingStatus === 'error' && <span className="text-[#D64545]">Save Failed</span>}
                                <span className="text-[#000000] font-medium opacity-50">|</span>
                                <span className="text-[#000000] font-medium">✏️ Editing Session</span>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="max-w-4xl mx-auto px-6 py-12">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-medium text-[#000000] mb-2">✏️ Edit & Re-analyze</h1>
                        <p className="text-[#636363]">Update your details and run a new analysis</p>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-4 relative">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-[rgba(0,0,0,0.08)] -z-10 rounded-full" />
                            <div
                                className="absolute top-1/2 left-0 h-1 bg-[#000000] -z-10 rounded-full transition-all duration-500"
                                style={{ width: `${((step - 1) / 4) * 100}%` }}
                            />

                            {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => updateStep(s)}
                                    className="flex flex-col items-center bg-[#f8f8f8] px-2 outline-none focus:outline-none"
                                >
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all border-2 ${s < step
                                            ? 'bg-[#184131] border-[#184131] text-white'
                                            : s === step
                                                ? 'bg-white border-[#000000] text-[#000000] shadow-[0_0_15px_rgba(184,134,11,0.3)]'
                                                : 'bg-[#f8f8f8] border-[#EBE2D6] text-[#959595]'
                                            }`}
                                    >
                                        {s < step ? '✓' : ['👤', '🪞', '📏', '📅', '✅'][s - 1]}
                                    </div>
                                    <span className={`text-xs mt-2 font-medium ${s === step ? 'text-[#000000]' : 'text-[#636363]'}`}>
                                        {s === 1 ? 'Birth' : s === 2 ? 'Physical' : s === 3 ? 'Forensic' : s === 4 ? 'Life Events' : 'Review'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-[#D64545]">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="min-h-[400px]">
                        {step === 1 && birthData && (
                            <Step1BirthDetails
                                data={birthData}
                                updateData={(updates: Partial<import('@/lib/types').BirthData>) => setBirthData(prev => prev ? { ...prev, ...updates } : updates as import('@/lib/types').BirthData)}
                                offsetConfig={offsetConfig}
                                updateOffset={setOffsetConfig}
                            />
                        )}
                        {step === 2 && (
                            <Step3PhysicalTraits
                                physicalTraits={forensicTraits.physical}
                                updateTraits={(p) => {
                                    setForensicTraits(prev => ({
                                        ...prev,
                                        physical: { ...prev.physical, ...p }
                                    }));
                                    setPhysicalTraits(prev => ({ ...prev, ...p }));
                                }}
                            />
                        )}
                        {step === 3 && (
                            <Step2ForensicTraits
                                traits={forensicTraits}
                                updateTraits={(updates) => {
                                    setForensicTraits(prev => ({ ...prev, ...updates }));
                                }}
                            />
                        )}
                        {step === 4 && (
                            <Step3LifeEvents
                                lifeEvents={lifeEvents}
                                updateEvents={setLifeEvents}
                                offsetConfig={offsetConfig}
                            />
                        )}
                        {step === 5 && birthData && (
                            <Step4Review
                                data={birthData}
                                events={lifeEvents}
                                traits={physicalTraits}
                                forensicTraits={forensicTraits}
                                onSubmit={submitEditedSession}
                                isSubmitting={isSubmitting}
                                onEdit={updateStep}
                                offsetConfig={offsetConfig}
                            />
                        )}
                    </div>

                    {step < 5 && (
                        <div className="flex justify-between mt-12 pt-6 border-t border-[rgba(0,0,0,0.08)]">
                            <button
                                onClick={goToPreviousStep}
                                disabled={step === 1}
                                className={`px-6 py-3 rounded-xl font-medium transition-colors ${step === 1
                                    ? 'opacity-0 cursor-default'
                                    : 'border-2 border-[#000000]/50 text-[#000000] hover:bg-[#000000]/10'
                                    }`}
                            >
                                ← Back
                            </button>

                            <button
                                onClick={advanceToNextStep}
                                className="px-8 py-3 bg-gradient-to-r from-[#000000] to-[#000000] text-white rounded-xl font-medium hover:shadow-[0_0_15px_rgba(184,134,11,0.4)] transition-all"
                            >
                                Next Step →
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </Layout>
    );
}
