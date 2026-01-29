'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import { BirthData, LifeEvent, PhysicalTraits, TimeOffsetConfig, SpouseData, ForensicTraits } from '@/lib/types';
import { Gender } from '@/lib/forensic-emojis';
import Step1BirthDetails from '@/components/rectify/Step1BirthDetails';
import Step3LifeEvents from '@/components/rectify/Step3LifeEvents';
import Step2ForensicTraits from '@/components/rectify/Step2ForensicTraits';
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
    eyeColor: 'medium',
    hairColor: 'black',
    hairType: 'straight',
    prakriti: 'pitta',
    noseType: 'sharp'
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

export default function RectifyPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [birthData, setBirthData] = useState<BirthData>(initialBirthData);
    const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
    const [physicalTraits, setPhysicalTraits] = useState<PhysicalTraits>(initialPhysicalTraits);
    const [forensicTraits, setForensicTraits] = useState<ForensicTraits>(initialForensicTraits);
    const [spouseData, setSpouseData] = useState<SpouseData>(initialSpouseData);
    const [offsetConfig, setOffsetConfig] = useState<TimeOffsetConfig>({ preset: '1hour', customMinutes: 60, description: '±1 hour' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuth();


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
                    forensicTraits,
                    spouseData: spouseData.dateOfBirth ? spouseData : undefined,
                    offsetConfig,
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
        // --- GOD-TIER WARMUP TRIGGER ---
        // Wake up Hugging Face Space immediately so it's ready by Step 4
        const pingWarmup = async () => {
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
                console.log('[WARMUP] Activating Sacred Engine in background...');
                fetch(`${backendUrl}/api/warmup`).catch(() => { }); // Fire and forget
            } catch (e) { }
        };
        pingWarmup();

        const saved = localStorage.getItem('btr_form_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.birthData) setBirthData(parsed.birthData);
                if (parsed.lifeEvents) setLifeEvents(parsed.lifeEvents);
                if (parsed.physicalTraits) setPhysicalTraits(parsed.physicalTraits);
                if (parsed.forensicTraits) {
                    // Deep merge with initial state to avoid undefined sub-objects from older drafts
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
            forensicTraits,
            offsetConfig,
            step,
            spouseData
        };
        localStorage.setItem('btr_form_data', JSON.stringify(dataToSave));
    }, [birthData, lifeEvents, physicalTraits, forensicTraits, spouseData, offsetConfig, step]);

    const handleNext = () => {
        if (isSubmitting) return; // Prevent navigation while submitting
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
        const missingFields: string[] = [];
        
        switch (currentStep) {
            case 1:
                if (!birthData.fullName?.trim()) missingFields.push("Full Name");
                if (!birthData.dateOfBirth) missingFields.push("Date of Birth");
                if (!birthData.tentativeTime) missingFields.push("Tentative Birth Time");
                if (!birthData.birthPlace?.trim()) missingFields.push("Birth Place");
                if (!birthData.gender) missingFields.push("Gender");
                
                if (missingFields.length > 0) {
                    setError(`⚠️ Please complete the following required fields: ${missingFields.join(", ")}`);
                    return false;
                }
                return true;
                
            case 2:
                // Forensic traits - MANDATORY for sub-second precision
                const { physical, psychographic, biological, family } = forensicTraits;
                
                // Physical/Facial markers
                if (!physical?.facialStructure?.forehead) missingFields.push("Forehead Type (Mukha Tab)");
                if (!physical?.facialStructure?.eyeShape) missingFields.push("Eye Shape (Mukha Tab)");
                if (!physical?.facialStructure?.voicePitch) missingFields.push("Voice Texture (Mukha Tab)");
                
                // Body Constitution
                if (!biological?.prakriti) missingFields.push("Body Constitution (Deha Tab)");
                
                // Psychographic markers
                if (!psychographic?.speechStyle) missingFields.push("Speech Style (Vyaktitva Tab)");
                if (!psychographic?.decisionMaking) missingFields.push("Decision Making Style (Vyaktitva Tab)");
                if (!psychographic?.temperament) missingFields.push("Temperament (Vyaktitva Tab)");
                
                // Family narrative
                if (!family?.siblingPosition) missingFields.push("Sibling Order (Kula Tab)");
                if (!family?.fatherStatusAtBirth) missingFields.push("Father's Status at Birth (Kula Tab)");
                
                if (missingFields.length > 0) {
                    setError(`🔱 FORENSIC DNA REQUIRED for God-Tier Precision:\n${missingFields.map(f => `  • ${f}`).join("\n")}\n\nPlease complete all forensic markers. These are essential for sub-second accuracy.`);
                    return false;
                }
                return true;
                
            case 3:
                if (lifeEvents.length < 3) {
                    setError(`📅 MINIMUM 3 LIFE EVENTS REQUIRED\n\nCurrent: ${lifeEvents.length} event(s)\nRequired: At least 3 events with dates\n\nTip: Add major events like graduation, marriage, career changes, relocations.`);
                    return false;
                }
                
                // Check for events without proper details
                const eventsWithoutDates = lifeEvents.filter(e => !e.eventDate);
                const eventsWithoutCategory = lifeEvents.filter(e => !e.category);
                const eventsWithoutType = lifeEvents.filter(e => !e.eventType);
                
                if (eventsWithoutDates.length > 0) {
                    setError(`⚠️ ${eventsWithoutDates.length} event(s) missing dates. Please add dates to all events.`);
                    return false;
                }
                if (eventsWithoutCategory.length > 0) {
                    setError(`⚠️ ${eventsWithoutCategory.length} event(s) missing category. Please select a category for each event.`);
                    return false;
                }
                if (eventsWithoutType.length > 0) {
                    setError(`⚠️ ${eventsWithoutType.length} event(s) missing event type. Please describe each event.`);
                    return false;
                }
                return true;
                
            default:
                return true;
        }
    };

    const handleSubmit = async () => {
        // CRITICAL GUARD: Only allow submission if on Step 4 (Review)
        if (step !== 4) {
            console.error("Attempted to submit analysis from step", step);
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
                    latitude: birthData.latitude || 28.6, // Fallback if geocoding failed
                    longitude: birthData.longitude || 77.2,
                    timezone: birthData.timezone,
                    gender: birthData.gender
                },
                lifeEvents: lifeEvents.map(e => ({
                    category: e.category,
                    eventType: e.eventType,
                    datePrecision: e.datePrecision,
                    eventDate: e.eventDate,
                    endDate: e.endDate,
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
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F5D061] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform">
                            <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">🕉️</span>
                        </div>
                        <span className="font-bold text-xl text-[#D4AF37] tracking-tight">AI Pandit</span>
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
                    <div className="flex items-start justify-between w-full">
                        {[1, 2, 3, 4].map((s) => (
                            <React.Fragment key={s}>
                                {/* Step Button */}
                                <button
                                    onClick={() => setStep(s)}
                                    className="relative z-10 flex flex-col items-center min-w-[80px] outline-none focus:outline-none"
                                >
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
                                    <span className={`text-xs mt-2 font-medium whitespace-nowrap ${s === step ? 'text-[#D4AF37]' : 'text-[#8C7F72]'}`}>
                                        {s === 1 ? 'Birth Details' :
                                            s === 2 ? 'Physical' :
                                                s === 3 ? 'Life Events' : 'Review'}
                                    </span>
                                </button>

                                {/* Connector Line (Except for last item) */}
                                {s < 4 && (
                                    <div className="flex-1 mt-5 mx-2 h-0.5 bg-white relative rounded">
                                        {/* Colored Progress Overlay */}
                                        <div
                                            className={`absolute top-0 left-0 h-full bg-[#D4AF37] transition-all duration-500 rounded ${s < step ? 'w-full' : 'w-0'
                                                }`}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
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
                {/* Step Content: UI Order (1: Birth, 2: Physical, 3: LifeEvents, 4: Review) */}
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
                            traits={physicalTraits}
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
