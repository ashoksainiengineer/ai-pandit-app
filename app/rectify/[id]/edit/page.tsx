'use client';

// app/rectify/[id]/edit/page.tsx
// Edit existing session data and re-submit for analysis

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { BirthData, LifeEvent, PhysicalTraits } from '@/lib/types';
import Step1BirthDetails from '@/components/rectify/Step1BirthDetails';
import Step3LifeEvents from '@/components/rectify/Step3LifeEvents';
import Step2ForensicTraits from '@/components/rectify/Step2ForensicTraits';
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
    const sessionId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1);
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
                const res = await fetch(`/api/sessions/${sessionId}`);
                const data = await res.json();

                if (!data.success) {
                    setError(data.error || 'Failed to load session');
                    setLoading(false);
                    return;
                }

                setBirthData(data.data.birthData);
                setLifeEvents(data.data.lifeEvents || []);
                if (data.data.physicalTraits) {
                    setPhysicalTraits(data.data.physicalTraits);
                }
                // Load forensic traits from database (new feature support)
                if (data.data.forensicTraits) {
                    setForensicTraits(data.data.forensicTraits);
                }
                // Load offset config if available, otherwise default
                if (data.data.offsetConfig) {
                    setOffsetConfig(data.data.offsetConfig);
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

    // Auto-save effect
    useEffect(() => {
        if (!isLoaded || !birthData) return;

        const saveDraft = async () => {
            setSavingStatus('saving');
            try {
                await fetch(`/api/sessions/${sessionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        birthData,
                        lifeEvents,
                        physicalTraits,
                        forensicTraits, // Include forensic traits in auto-save
                        offsetConfig,
                        isDraft: true // Important: Don't reset status
                    })
                });
                setSavingStatus('saved');
                setTimeout(() => setSavingStatus('idle'), 2000);
            } catch (err) {
                console.error('Auto-save failed:', err);
                setSavingStatus('error');
            }
        };

        const timer = setTimeout(saveDraft, 1000);
        return () => clearTimeout(timer);
    }, [birthData, lifeEvents, physicalTraits, offsetConfig, isLoaded, sessionId]);

    const handleNext = () => {
        setError(null);
        if (validateStep(step)) {
            setStep(s => s + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        setError(null);
        setStep(s => s - 1);
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
                // Step 2 is Physical Traits in the UI order (step state map is: 1=Birth, 2=Physical, 3=LifeEvents, 4=Review) 
                // Wait, in the render:
                // step 2 = Step2PhysicalTraits
                // step 3 = Step3LifeEvents
                // This seems swapped compared to validate function?
                // Let's check the render: 
                // {step === 2 && (<Step2PhysicalTraits ... />)}
                // {step === 3 && (<Step3LifeEvents ... />)}
                // So Step 2 is Physical, Step 3 is Life Events.
                return true;
            case 3:
                // Life Events validation (Step 3)
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
            // Final update (not draft)
            const updateRes = await fetch(`/api/sessions/${sessionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    birthData,
                    lifeEvents,
                    physicalTraits,
                    forensicTraits, // Include forensic traits in final save
                    offsetConfig
                    // isDraft undefined -> Resets status
                })
            });

            const updateResult = await updateRes.json();
            if (!updateResult.success) {
                setError(updateResult.error || 'Failed to update session');
                setIsSubmitting(false);
                return;
            }

            // Then re-queue the session
            const queueRes = await fetch(`/api/sessions/${sessionId}/requeue`, {
                method: 'POST'
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
                            style={{ width: `${((step - 1) / 3) * 100}%` }}
                        />

                        {[1, 2, 3, 4].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStep(s)}
                                className="flex flex-col items-center bg-[#FFFCF8] px-2 outline-none focus:outline-none"
                            >
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2 ${s < step
                                        ? 'bg-[#2D7A5C] border-[#2D7A5C] text-white'
                                        : s === step
                                            ? 'bg-[#FFFCF8] border-[#B8860B] text-[#B8860B]'
                                            : 'bg-[#F0E8DE] border-[#F0E8DE] text-[#7A756F]'
                                        }`}
                                >
                                    {s < step ? '✓' : ['👤', '🪞', '📅', '✅'][s - 1]}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${s === step ? 'text-[#B8860B]' : 'text-[#7A756F]'}`}>
                                    {s === 1 ? 'Birth Details' : s === 2 ? 'Physical' : s === 3 ? 'Life Events' : 'Review'}
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
                    {step === 3 && (
                        <Step3LifeEvents
                            lifeEvents={lifeEvents}
                            updateEvents={setLifeEvents}
                        />
                    )}
                    {step === 4 && birthData && (
                        <Step4Review
                            data={birthData}
                            events={lifeEvents}
                            traits={physicalTraits}
                            forensicTraits={{
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
                            onEdit={setStep}
                            offsetConfig={offsetConfig}
                        />
                    )}
                </div>

                {/* Navigation */}
                {step < 4 && (
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
