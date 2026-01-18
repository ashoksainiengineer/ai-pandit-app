'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { BirthData, LifeEvent, PhysicalTraits, TimeOffsetConfig } from '@/lib/types';
import Step1BirthDetails from '@/components/rectify/Step1BirthDetails';
import Step2LifeEvents from '@/components/rectify/Step2LifeEvents';
import Step3PhysicalTraits from '@/components/rectify/Step3PhysicalTraits';
import Step4Review from '@/components/rectify/Step4Review';

// Initial States
const initialBirthData: BirthData = {
    fullName: '',
    dateOfBirth: '',
    tentativeTime: '',
    birthPlace: '',
    latitude: 0,
    longitude: 0,
    timezone: 5.5, // Default India
    gender: 'male' // Default
};

const initialPhysicalTraits: PhysicalTraits = {
    height: { cm: 165, feet: 5, inches: 5 },
    build: 'medium',
    complexion: 'medium',
    faceShape: 'oval',
    eyeColor: 'brown',
    hairColor: 'black'
};

export default function RectifyPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [birthData, setBirthData] = useState<BirthData>(initialBirthData);
    const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
    const [physicalTraits, setPhysicalTraits] = useState<PhysicalTraits>(initialPhysicalTraits);
    const [offsetConfig, setOffsetConfig] = useState<TimeOffsetConfig>({ preset: '1hour', customMinutes: 60, description: '±1 hour' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cloud draft sync
    const [draftSessionId, setDraftSessionId] = useState<string | null>(null);
    const [cloudSaveStatus, setCloudSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Save draft to cloud (Turso)
    const saveDraftToCloud = async () => {
        if (!birthData.fullName) return; // Need at least name

        setCloudSaveStatus('saving');
        try {
            const res = await fetch('/api/drafts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    birthData,
                    lifeEvents,
                    physicalTraits,
                    offsetConfig, // Use state
                    sessionId: draftSessionId,
                }),
            });

            const result = await res.json();
            if (result.success) {
                setDraftSessionId(result.sessionId);
                setCloudSaveStatus('saved');
                localStorage.setItem('btr_draft_id', result.sessionId);
            } else {
                setCloudSaveStatus('error');
            }
        } catch (err) {
            setCloudSaveStatus('error');
        }
    };

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('btr_form_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.birthData) setBirthData(parsed.birthData);
                if (parsed.lifeEvents) setLifeEvents(parsed.lifeEvents);
                if (parsed.physicalTraits) setPhysicalTraits(parsed.physicalTraits);
                if (parsed.step) setStep(parsed.step);
            } catch (e) {
                console.error('Failed to restore form data', e);
            }
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        const dataToSave = {
            birthData,
            lifeEvents,
            physicalTraits,
            step
        };
        localStorage.setItem('btr_form_data', JSON.stringify(dataToSave));
    }, [birthData, lifeEvents, physicalTraits, step]);

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
        switch (currentStep) {
            case 1:
                if (!birthData.fullName) { setError("Full Name is required"); return false; }
                if (!birthData.dateOfBirth) { setError("Date of Birth is required"); return false; }
                if (!birthData.tentativeTime) { setError("Birth Time is required"); return false; }
                if (!birthData.birthPlace) { setError("Birth Place is required"); return false; }
                return true;
            case 2:
                // Physical traits - optional but check ranges if entered
                if (physicalTraits.height?.cm && (physicalTraits.height.cm < 50 || physicalTraits.height.cm > 250)) {
                    setError("Please enter a valid height");
                    return false;
                }
                return true;
            case 3:
                if (lifeEvents.length < 5) {
                    setError("Please add at least 5 life events for 99%+ accuracy. The more events you provide, the more precise your rectification will be.");
                    return false;
                }
                // Check if events have dates filled
                const eventsWithoutDates = lifeEvents.filter(e => !e.eventDate);
                if (eventsWithoutDates.length > 0) {
                    setError(`Please fill in dates for all events. ${eventsWithoutDates.length} event(s) missing dates.`);
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                birthData: {
                    fullName: birthData.fullName,
                    dateOfBirth: birthData.dateOfBirth,
                    tentativeTime: birthData.tentativeTime,
                    birthPlace: birthData.birthPlace,
                    latitude: birthData.latitude || 28.6, // Fallback if geocoding failed
                    longitude: birthData.longitude || 77.2,
                    timezone: birthData.timezone,
                    gender: birthData.gender
                },
                lifeEvents: lifeEvents.map(e => ({
                    ...e,
                    // Ensure generic fields needed by backend are present
                    category: e.category,
                    eventType: e.eventType,
                    eventDate: e.eventDate,
                    description: e.description,
                    importance: e.importance
                })),
                offsetConfig, // Use state
                physicalTraits
            };

            const response = await fetch('/api/queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            console.log('API Response:', result); // Debug logging

            if (result.success) {
                // Clear storage on success
                localStorage.removeItem('btr_form_data');
                router.push(`/rectify/${result.data.sessionId}`);
            } else {
                console.error('API Error:', result.error);
                setError(result.error || 'Failed to submit analysis');
            }
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.message || 'Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0F1419] text-[#F5F0EB]">
            {/* Header */}
            <nav className="sticky top-0 z-50 bg-[#0F1419]/90 backdrop-blur-xl border-b border-[#D4AF37]/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="text-2xl">🕉️</span>
                        <span className="font-bold text-xl text-[#D4AF37]">AI Pandit</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="text-[#C4B8AD] hover:text-[#D4AF37] transition-colors">
                            📊 Dashboard
                        </Link>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Progress Indicator */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-4 relative">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-[#2A3442] -z-10 rounded-full" />
                        <div
                            className="absolute top-1/2 left-0 h-1 bg-[#D4AF37] -z-10 rounded-full transition-all duration-500"
                            style={{ width: `${((step - 1) / 3) * 100}%` }}
                        />

                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex flex-col items-center bg-[#0F1419] px-2">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2 ${s < step
                                        ? 'bg-[#2D7A5C] border-[#2D7A5C] text-white'
                                        : s === step
                                            ? 'bg-[#0F1419] border-[#D4AF37] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                                            : 'bg-[#2A3442] border-[#2A3442] text-[#8C7F72]'
                                        }`}
                                >
                                    {s < step ? '✓' : ['👤', '🪞', '📅', '✅'][s - 1]}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${s === step ? 'text-[#D4AF37]' : 'text-[#8C7F72]'}`}>
                                    {s === 1 ? 'Birth Details' :
                                        s === 2 ? 'Physical' :
                                            s === 3 ? 'Life Events' : 'Review'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-[#EF4444] animate-pulse">
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
                        />
                    )}
                    {step === 2 && (
                        <Step3PhysicalTraits
                            physicalTraits={physicalTraits}
                            updateTraits={(updates) => setPhysicalTraits(prev => ({ ...prev, ...updates }))}
                        />
                    )}
                    {step === 3 && (
                        <Step2LifeEvents
                            lifeEvents={lifeEvents}
                            updateEvents={setLifeEvents}
                        />
                    )}
                    {step === 4 && (
                        <Step4Review
                            data={birthData}
                            events={lifeEvents}
                            traits={physicalTraits}
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            onEdit={setStep}
                        />
                    )}
                </div>

                {/* Navigation */}
                {step < 4 && (
                    <div className="flex justify-between items-center mt-12 pt-6 border-t border-white/5">
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className={`px-6 py-3 rounded-xl font-semibold transition-colors ${step === 1
                                ? 'opacity-0 cursor-default'
                                : 'border-2 border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10'
                                }`}
                        >
                            ← Back
                        </button>

                        {/* Cloud Save Button */}
                        <button
                            onClick={saveDraftToCloud}
                            disabled={cloudSaveStatus === 'saving' || !birthData.fullName}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${cloudSaveStatus === 'saved'
                                ? 'bg-[#2D7A5C]/20 text-[#2D7A5C] border border-[#2D7A5C]/30'
                                : cloudSaveStatus === 'saving'
                                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 animate-pulse'
                                    : cloudSaveStatus === 'error'
                                        ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                                        : 'bg-[#2A3442] text-[#C4B8AD] border border-[#8C7F72]/30 hover:border-[#D4AF37]/50'
                                }`}
                        >
                            {cloudSaveStatus === 'saving' ? (
                                <>💾 Saving...</>
                            ) : cloudSaveStatus === 'saved' ? (
                                <>☁️ Saved to Cloud</>
                            ) : cloudSaveStatus === 'error' ? (
                                <>⚠️ Retry Save</>
                            ) : (
                                <>☁️ Save to Cloud</>
                            )}
                        </button>

                        <button
                            onClick={handleNext}
                            className="px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] rounded-xl font-semibold hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all"
                        >
                            Next Step →
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
