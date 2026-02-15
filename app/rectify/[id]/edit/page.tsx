'use client';

// app/rectify/[id]/edit/page.tsx
// Edit existing session data and re-submit for analysis

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { BirthData, LifeEvent, PhysicalTraits } from '@/lib/types';
import { env } from '@/lib/config';
import Step1BirthDetails from '@/components/rectify/Step1BirthDetails';
import Step3LifeEvents from '@/components/rectify/Step3LifeEvents';
import Step2ForensicTraits from '@/components/rectify/Step2ForensicTraits';
import Step3PhysicalTraits from '@/components/rectify/Step3PhysicalTraits';
import Step4Review from '@/components/rectify/Step4Review';

const initialPhysicalTraits: PhysicalTraits = {
    height: { cm: 165, feet: 5, inches: 5 },
    build: 'medium',
    complexion: 'medium',
    faceShape: 'oval',
    eyeColor: 'brown',
    hairColor: 'black'
};

export default function EditSessionPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Read initial step from URL query param, default to 1
    const getInitialStep = () => {
        const urlStep = searchParams.get('step');
        if (urlStep) {
            const parsed = parseInt(urlStep, 10);
            if (parsed >= 1 && parsed <= 5) {
                return parsed;
            }
        }
        return 1;
    };
    const [step, setStep] = useState(getInitialStep());

    // Update URL when step changes
    const updateStep = (newStep: number) => {
        setStep(newStep);
        const params = new URLSearchParams(searchParams.toString());
        params.set('step', newStep.toString());
        router.replace(`/rectify/${sessionId}/edit?${params.toString()}`, { scroll: false });
    };
    const [birthData, setBirthData] = useState<BirthData | null>(null);
    const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
    const [physicalTraits, setPhysicalTraits] = useState<PhysicalTraits>(initialPhysicalTraits);
    const [offsetConfig, setOffsetConfig] = useState<any>({ preset: '1hour', customMinutes: 60, description: '±1 hour' });
    const [forensicTraits, setForensicTraits] = useState<any>(null); // Forensic traits from database
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-save state
    const [isLoaded, setIsLoaded] = useState(false);
    const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Load existing session data
    useEffect(() => {
        async function fetchSession() {
            try {
                const backendUrl = env.api.backendUrl.replace(/\/$/, '');
                // Use the new queue endpoint which handles session retrieval too
                const res = await fetch(`${backendUrl}/api/queue?sessionId=${sessionId}`);
                const data = await res.json();

                if (!data.success) {
                    setError(data.error || 'Failed to load session');
                    setLoading(false);
                    return;
                }

                // Data mapping from queue format
                const session = data.data;
                setBirthData(session.birthData);
                setLifeEvents(session.lifeEvents || []);
                if (session.physicalTraits) {
                    setPhysicalTraits(session.physicalTraits);
                }
                // Load forensic traits from database (new feature support)
                if (session.forensicTraits) {
                    setForensicTraits(session.forensicTraits);
                }
                // Load offset config if available, otherwise default
                if (session.offsetConfig) {
                    setOffsetConfig(typeof session.offsetConfig === 'string' ? JSON.parse(session.offsetConfig) : session.offsetConfig);
                }
                setLoading(false);
                setIsLoaded(true); // Data loaded, enable auto-save
            } catch (err) {
                setError('Failed to fetch session data');
                setLoading(false);
            }
        }

        fetchSession();
    }, [sessionId]);

    // Auto-save effect with debounce - only save after user stops typing
    const [lastSavedData, setLastSavedData] = useState<string>('');

    useEffect(() => {
        if (!isLoaded || !birthData) return;

        // Only save if there's actual meaningful data
        if (!birthData.fullName || birthData.fullName.trim().length < 2) return;

        const currentData = JSON.stringify({ birthData, lifeEvents, physicalTraits, forensicTraits, offsetConfig });

        // Don't save if data hasn't changed from last save
        if (currentData === lastSavedData) return;

        const saveDraft = async () => {
            setSavingStatus('saving');
            try {
                const backendUrl = env.api.backendUrl.replace(/\/$/, '');
                await fetch(`${backendUrl}/api/drafts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId, // Include session ID to update existing
                        birthData,
                        lifeEvents,
                        physicalTraits,
                        forensicTraits,
                        offsetConfig,
                        isDraft: true
                    })
                });
                setLastSavedData(currentData);
                setSavingStatus('saved');
                setTimeout(() => setSavingStatus('idle'), 2000);
            } catch (err) {
                console.error('Auto-save failed:', err);
                setSavingStatus('error');
            }
        };

        // 3 second debounce - only save after user stops typing for 3 seconds
        const timer = setTimeout(saveDraft, 3000);
        return () => clearTimeout(timer);
    }, [birthData, lifeEvents, physicalTraits, forensicTraits, offsetConfig, isLoaded, sessionId, lastSavedData]);

    const handleNext = () => {
        setError(null);
        if (validateStep(step)) {
            const newStep = step + 1;
            updateStep(newStep);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
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
                // Step 2 is now Physical Traits
                // Optional validation for physical traits can be added here
                return true;
            case 3:
                // Step 3 is now Forensic Traits
                // Optional validation for forensic traits can be added here
                return true;
            case 4:
                // Life Events validation (Step 4)
                if (lifeEvents.length < 5) {
                    setError("Please add at least 5 life events");
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const handleSubmit = async () => {
        if (!birthData) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const backendUrl = env.api.backendUrl.replace(/\/$/, '');

            // Final update (not draft)
            // Use the submit endpoint logic or just update then requeue
            // Since we don't have a direct "update session" endpoint exposed publicly except for drafts/submit
            // We will use the calculate/submit flow logic

            const payload = {
                birthData,
                lifeEvents,
                physicalTraits,
                forensicTraits,
                offsetConfig
            };

            const submitUrl = `${backendUrl}/api/sessions/${sessionId}/submit`;

            const updateRes = await fetch(submitUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const updateResult = await updateRes.json();
            if (!updateResult.success) {
                setError(updateResult.error || 'Failed to update session');
                setIsSubmitting(false);
                return;
            }

            // Then re-queue the session
            const queueRes = await fetch(`${backendUrl}/api/queue/requeue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });

            const queueResult = await queueRes.json();
            if (!queueResult.success) {
                // Even if re-queue fails, redirect to progress page
                console.warn('Re-queue warning:', queueResult.error);
            }

            // Redirect to progress page
            router.push(`/rectify/${sessionId}`);

        } catch (err: any) {
            setError(err.message || 'Network error');
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#FFFCF8] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#7A756F]">Loading session data...</p>
                </div>
            </main>
        );
    }

    if (error && !birthData) {
        return (
            <main className="min-h-screen bg-[#FFFCF8] flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-[#1A1612] mb-2">Could not load session</h1>
                    <p className="text-[#7A756F] mb-6">{error}</p>
                    <Link href="/dashboard" className="inline-block px-6 py-3 bg-[#B8860B] text-white rounded-lg font-bold hover:bg-[#D4A853] transition-colors">
                        Back to Dashboard
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#FFFCF8] text-[#1A1612]">
            {/* Header */}
            <nav className="sticky top-0 z-50 bg-[#FFFCF8]/90 backdrop-blur-xl border-b border-[#F0E8DE]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <span className="font-bold text-xl text-[#B8860B] tracking-tight">AI Pandit</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-[#7A756F] hover:text-[#B8860B] transition-colors"
                        >
                            Dashboard
                        </Link>
                        <div className="flex items-center gap-2 text-sm">
                            {savingStatus === 'saving' && <span className="text-[#B8860B] animate-pulse">Saving...</span>}
                            {savingStatus === 'saved' && <span className="text-[#2D7A5C]">Saved ✓</span>}
                            {savingStatus === 'error' && <span className="text-[#D64545]">Save Failed</span>}
                            <span className="text-[#B8860B] font-medium opacity-50">|</span>
                            <span className="text-[#B8860B] font-medium">✏️ Editing Session</span>
                        </div>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Title */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-[#B8860B] mb-2">✏️ Edit & Re-analyze</h1>
                    <p className="text-[#7A756F]">Update your details and run a new analysis</p>
                </div>

                {/* Progress Indicator */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-4 relative">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-[#F0E8DE] -z-10 rounded-full" />
                        <div
                            className="absolute top-1/2 left-0 h-1 bg-[#B8860B] -z-10 rounded-full transition-all duration-500"
                            style={{ width: `${((step - 1) / 4) * 100}%` }}
                        />

                        {[1, 2, 3, 4, 5].map((s) => (
                            <button
                                key={s}
                                onClick={() => updateStep(s)}
                                className="flex flex-col items-center bg-[#FFFCF8] px-2 outline-none focus:outline-none"
                            >
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2 ${s < step
                                        ? 'bg-[#2D7A5C] border-[#2D7A5C] text-white'
                                        : s === step
                                            ? 'bg-white border-[#B8860B] text-[#B8860B] shadow-[0_0_15px_rgba(184,134,11,0.3)]'
                                            : 'bg-[#F5EFE7] border-[#EBE2D6] text-[#A8A39D]'
                                        }`}
                                >
                                    {s < step ? '✓' : ['👤', '🪞', '📏', '📅', '✅'][s - 1]}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${s === step ? 'text-[#B8860B]' : 'text-[#7A756F]'}`}>
                                    {s === 1 ? 'Birth' : s === 2 ? 'Physical' : s === 3 ? 'Forensic' : s === 4 ? 'Life Events' : 'Review'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-[#D64545]">
                        ⚠️ {error}
                    </div>
                )}

                {/* Step Content */}
                <div className="min-h-[400px]">
                    {step === 1 && birthData && (
                        <Step1BirthDetails
                            data={birthData}
                            updateData={(updates) => setBirthData(prev => prev ? { ...prev, ...updates } : null)}
                            offsetConfig={offsetConfig}
                            updateOffset={setOffsetConfig}
                        />
                    )}
                    {step === 2 && (
                        <Step3PhysicalTraits
                            physicalTraits={forensicTraits?.physical || {
                                facialStructure: {},
                                skinHair: { marks: [] },
                                build: '',
                                height: { cm: 0, feet: 0, inches: 0 }
                            }}
                            updateTraits={(p) => {
                                // Update forensic traits storage
                                setForensicTraits((prev: any) => ({
                                    ...prev,
                                    physical: { ...(prev?.physical || {}), ...p }
                                }));
                                // Also sync legacy physicalTraits state for Review step compatibility
                                setPhysicalTraits((prev) => ({
                                    ...prev,
                                    ...p
                                }));
                            }}
                        />
                    )}
                    {step === 3 && (
                        <Step2ForensicTraits
                            traits={forensicTraits || {
                                physical: {
                                    facialStructure: { forehead: '', eyeShape: '', noseType: '', teethAlignment: '', voicePitch: '' },
                                    skinHair: { texture: '', hairType: '', complexion: '', marks: [] },
                                    build: '',
                                    height: { cm: 0, feet: 0, inches: 0 }
                                },
                                psychographic: { speechStyle: '', decisionMaking: '', stressResponse: '', sleepCycle: '', temperament: '' },
                                biological: { prakriti: '', sensitivity: { heat: '', cold: '' }, recurringHealthIssues: [] },
                                family: { siblingPosition: '', brotherCount: 0, sisterCount: 0, fatherStatusAtBirth: '', motherHealthAtBirth: '' }
                            }}
                            updateTraits={(updates) => {
                                setForensicTraits(prev => {
                                    const current = prev || {
                                        physical: { facialStructure: {}, skinHair: {}, build: '', height: { cm: 0, feet: 0, inches: 0 } },
                                        psychographic: {},
                                        biological: {},
                                        family: {}
                                    };
                                    return { ...current, ...updates };
                                });
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
                            forensicTraits={forensicTraits || {
                                physical: {
                                    facialStructure: {},
                                    skinHair: { marks: [] },
                                    height: typeof physicalTraits.height === 'object' && physicalTraits.height !== null
                                        ? physicalTraits.height as { cm: number; feet: number; inches: number }
                                        : { cm: 168, feet: 5, inches: 6 }
                                },
                                psychographic: {},
                                biological: { sensitivity: {} },
                                family: { brotherCount: 0, sisterCount: 0 }
                            }}
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            onEdit={updateStep}
                            offsetConfig={offsetConfig}
                        />
                    )}
                </div>

                {/* Navigation */}
                {step < 5 && (
                    <div className="flex justify-between mt-12 pt-6 border-t border-[#F0E8DE]">
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

                        <button
                            onClick={handleNext}
                            className="px-8 py-3 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white rounded-xl font-semibold hover:shadow-[0_0_15px_rgba(184,134,11,0.4)] transition-all"
                        >
                            Next Step →
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
